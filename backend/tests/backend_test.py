import base64
import io
import os

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Core / meta endpoints ----------
class TestMeta:
    def test_root(self, api):
        r = api.get(f"{BASE_URL}/api/", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["name"] == "Virana API"
        assert "Preserve" in d["tagline"]

    def test_stats(self, api):
        r = api.get(f"{BASE_URL}/api/stats", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["total_records"] >= 30, d
        assert d["at_risk"] >= 1
        assert d["states_covered"] >= 5
        assert isinstance(d["categories"], dict) and len(d["categories"]) > 0

    def test_states(self, api):
        r = api.get(f"{BASE_URL}/api/states", timeout=30)
        assert r.status_code == 200
        states = r.json()["states"]
        assert len(states) >= 10
        assert all("name" in s for s in states)

    def test_categories(self, api):
        r = api.get(f"{BASE_URL}/api/categories", timeout=30)
        assert r.status_code == 200
        cats = r.json()["categories"]
        assert len(cats) >= 5
        ids = [c["id"] for c in cats]
        assert "monuments" in ids


# ---------- Heritage listing / filters / search ----------
class TestHeritage:
    REQUIRED = ["id", "name", "category", "state", "lat", "lng", "image", "preservation"]

    def test_list_all(self, api):
        r = api.get(f"{BASE_URL}/api/heritage", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["count"] >= 30
        assert d["count"] == len(d["records"])
        for rec in d["records"]:
            for f in self.REQUIRED:
                assert f in rec, f"missing {f} in {rec.get('id')}"
            assert "_id" not in rec
            assert isinstance(rec["lat"], (int, float))

    def test_filter_category(self, api):
        r = api.get(f"{BASE_URL}/api/heritage", params={"category": "monuments"}, timeout=30)
        assert r.status_code == 200
        recs = r.json()["records"]
        assert len(recs) > 0
        assert {x["category"] for x in recs} == {"monuments"}

    def test_filter_preservation(self, api):
        r = api.get(f"{BASE_URL}/api/heritage", params={"preservation": "AT_RISK"}, timeout=30)
        assert r.status_code == 200
        recs = r.json()["records"]
        assert len(recs) > 0
        assert {x["preservation"] for x in recs} == {"AT_RISK"}

    def test_filter_state(self, api):
        r = api.get(f"{BASE_URL}/api/heritage", params={"state": "Kerala"}, timeout=30)
        assert r.status_code == 200
        recs = r.json()["records"]
        assert len(recs) > 0
        assert {x["state"] for x in recs} == {"Kerala"}

    def test_search(self, api):
        r = api.get(f"{BASE_URL}/api/heritage/search", params={"q": "taj"}, timeout=30)
        assert r.status_code == 200
        recs = r.json()["records"]
        assert any("Taj Mahal" in x["name"] for x in recs), recs

    def test_search_empty_query(self, api):
        r = api.get(f"{BASE_URL}/api/heritage/search", params={"q": " "}, timeout=30)
        assert r.status_code == 200
        assert r.json()["count"] == 0

    def test_detail(self, api):
        r = api.get(f"{BASE_URL}/api/heritage/taj-mahal", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["id"] == "taj-mahal"
        assert d["name"].startswith("Taj Mahal")
        for f in ["history", "architecture", "significance", "related"]:
            assert f in d and d[f], f"missing/empty {f}"
        assert isinstance(d["related"], list) and len(d["related"]) > 0
        assert all(rel["id"] != "taj-mahal" for rel in d["related"])
        assert "_id" not in d

    def test_detail_404(self, api):
        r = api.get(f"{BASE_URL}/api/heritage/nonexistent-id", timeout=30)
        assert r.status_code == 404
        assert "detail" in r.json()


# ---------- AI endpoints (Gemini) ----------
class TestAI:
    def test_ask(self, api):
        r = api.post(f"{BASE_URL}/api/ai/ask",
                     json={"message": "Tell me briefly about Kuchipudi dance."}, timeout=180)
        assert r.status_code == 200, r.text[:500]
        d = r.json()
        assert d["session_id"]
        assert isinstance(d["reply"], str) and len(d["reply"].strip()) > 30
        assert isinstance(d["sources"], list)

    def test_ask_preserves_session(self, api):
        sid = "TEST_session_virana_1"
        r = api.post(f"{BASE_URL}/api/ai/ask",
                     json={"session_id": sid, "message": "Where is the Taj Mahal located?"},
                     timeout=180)
        assert r.status_code == 200, r.text[:500]
        assert r.json()["session_id"] == sid
        assert len(r.json()["reply"].strip()) > 10

    def test_lens_analyze(self, api):
        # Small synthetic solid-color JPEG (valid image, minimal payload)
        try:
            from PIL import Image
            buf = io.BytesIO()
            Image.new("RGB", (64, 64), (200, 170, 120)).save(buf, format="JPEG")
            b64 = base64.b64encode(buf.getvalue()).decode()
        except Exception:
            pytest.skip("PIL unavailable")
        r = api.post(f"{BASE_URL}/api/heritage-lens/analyze",
                     json={"image_base64": b64, "mime_type": "image/jpeg"}, timeout=180)
        assert r.status_code == 200, r.text[:500]
        d = r.json()
        assert isinstance(d["identified_name"], str) and d["identified_name"]
        assert isinstance(d["confidence"], int) and 0 <= d["confidence"] <= 100
        assert isinstance(d["description"], str)
        assert isinstance(d["possible_matches"], list)


# ---------- Cleanup ----------
@pytest.fixture(scope="session", autouse=True)
def cleanup():
    yield
    try:
        from pymongo import MongoClient
        backend_env = dotenv_values("/app/backend/.env")
        c = MongoClient(backend_env["MONGO_URL"])
        c[backend_env["DB_NAME"]].chat_messages.delete_many({"session_id": "TEST_session_virana_1"})
        c.close()
    except Exception:
        pass
