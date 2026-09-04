"""Virana interactive map service — geospatial cultural records over MongoDB.
Unifies heritage + festivals into a single geo-indexed collection and exposes
viewport, region, search, nearby, AI-search and analytics endpoints."""
import os, json, uuid, logging
from datetime import datetime, timezone, date
from fastapi import APIRouter, HTTPException, Query, Body
from typing import Optional
from pydantic import BaseModel

from heritage_seed import HERITAGE_SEED
from festival_seed import FESTIVAL_SEED

logger = logging.getLogger("virana.map")
router = APIRouter(prefix="/map", tags=["map"])
_db = None

# ---- Layer taxonomy (single source of truth, mirrored on frontend) ----
LAYER_META = {
    "heritage":  {"name": "Heritage & Monuments", "color": "#E89B17"},
    "festivals": {"name": "Festivals",            "color": "#D4368A"},
    "dance":     {"name": "Dance",                "color": "#C85A32"},
    "music":     {"name": "Music & Instruments",  "color": "#3B5998"},
    "food":      {"name": "Food & Spices",        "color": "#B8433E"},
    "crafts":    {"name": "Arts & Crafts",        "color": "#1B7A56"},
    "languages": {"name": "Languages",            "color": "#6E4C9E"},
    "rituals":   {"name": "Rituals & Stories",    "color": "#7A6C48"},
    "at_risk":   {"name": "Heritage at Risk",     "color": "#DC2626"},
}
CATEGORY_TO_LAYER = {
    "monuments": "heritage", "temples": "heritage",
    "festivals": "festivals", "dance": "dance",
    "music": "music", "instruments": "music",
    "food": "food", "spices": "food",
    "crafts": "crafts", "languages": "languages", "rituals": "rituals",
}
STATE_NORMALISE = {
    "Pan-India": None, "South India": None, "Pan-India (North)": None,
    "Andhra Pradesh / Telangana": "Andhra Pradesh",
    "Jammu & Kashmir": "Jammu & Kashmir",
}


def _norm_state(name):
    if not name:
        return None
    return STATE_NORMALISE.get(name, name)


def init(db):
    global _db
    _db = db


async def build_map_records():
    """(Re)build unified geo collection on startup."""
    docs = []
    for r in HERITAGE_SEED:
        if r.get("lat") is None or r.get("lng") is None:
            continue
        layer = CATEGORY_TO_LAYER.get(r["category"], "heritage")
        risk = r.get("preservation") == "AT_RISK"
        docs.append({
            "id": f"heritage:{r['id']}",
            "ref_type": "heritage", "ref_id": r["id"],
            "name": r["name"], "layer": layer, "category": r["category"],
            "state": _norm_state(r.get("state")), "state_raw": r.get("state"),
            "district": r.get("district"), "region": None,
            "lat": r["lat"], "lng": r["lng"],
            "location": {"type": "Point", "coordinates": [r["lng"], r["lat"]]},
            "image": r.get("image"), "short": r.get("short", ""),
            "verification": r.get("status") == "verified",
            "source": "institutional", "risk": risk,
            "era": r.get("era"),
        })
    for f in FESTIVAL_SEED:
        if f.get("lat") is None or f.get("lng") is None:
            continue
        docs.append({
            "id": f"festival:{f['id']}",
            "ref_type": "festival", "ref_id": f["id"],
            "name": f["name"], "layer": "festivals", "category": "festivals",
            "state": _norm_state(f.get("state")), "state_raw": f.get("state"),
            "district": f.get("district"), "region": f.get("region"),
            "lat": f["lat"], "lng": f["lng"],
            "location": {"type": "Point", "coordinates": [f["lng"], f["lat"]]},
            "image": f.get("image") or f.get("image_url"),
            "short": f.get("significance") or f.get("description", ""),
            "verification": f.get("verification") in (True, "verified", "Verified"),
            "source": "institutional", "risk": False,
            "start_date": f.get("start_date"), "type": f.get("type"),
        })
    await _db.map_records.delete_many({})
    if docs:
        await _db.map_records.insert_many(docs)
    await _db.map_records.create_index([("location", "2dsphere")])
    await _db.map_records.create_index("layer")
    await _db.map_records.create_index("state")
    await _db.map_records.create_index([("ref_type", 1), ("ref_id", 1)])
    logger.info(f"Built {len(docs)} map records")


def _feature(d):
    return {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [d["lng"], d["lat"]]},
        "properties": {
            "id": d["id"], "ref_type": d["ref_type"], "ref_id": d["ref_id"],
            "name": d["name"], "layer": d["layer"], "category": d["category"],
            "state": d.get("state"), "district": d.get("district"),
            "image": d.get("image"), "short": d.get("short", ""),
            "verification": d.get("verification", False),
            "source": d.get("source", "institutional"),
            "risk": d.get("risk", False), "start_date": d.get("start_date"),
        },
    }


def _proj():
    return {"_id": 0, "location": 0}


@router.get("/meta")
async def map_meta():
    return {"layers": LAYER_META}


@router.get("/records")
async def map_records(
    bbox: Optional[str] = None, layers: Optional[str] = None,
    state: Optional[str] = None, district: Optional[str] = None,
    risk: Optional[bool] = None, festival: Optional[str] = None,
    month: Optional[int] = None, q: Optional[str] = None,
    limit: int = 2000,
):
    query = {}
    if bbox:
        try:
            mnl, mnla, mxl, mxla = [float(x) for x in bbox.split(",")]
            query["location"] = {"$geoWithin": {"$box": [[mnl, mnla], [mxl, mxla]]}}
        except Exception:
            raise HTTPException(400, "Invalid bbox; expected minLng,minLat,maxLng,maxLat")
    if layers:
        query["layer"] = {"$in": [l.strip() for l in layers.split(",") if l.strip()]}
    if state:
        query["state"] = state
    if district:
        query["district"] = district
    if risk:
        query["risk"] = True
    if festival:
        query["ref_id"] = festival
    if month:
        query["start_date"] = {"$regex": f"-{int(month):02d}-"}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    docs = await _db.map_records.find(query, _proj()).limit(limit).to_list(length=limit)
    return {"type": "FeatureCollection",
            "count": len(docs),
            "features": [_feature(d) for d in docs]}


@router.get("/regions")
async def region_stats():
    """Per-state aggregate stats for hover cards."""
    today = date.today().isoformat()
    pipeline = [
        {"$match": {"state": {"$ne": None}}},
        {"$group": {
            "_id": "$state",
            "records": {"$sum": 1},
            "heritage": {"$sum": {"$cond": [{"$eq": ["$layer", "heritage"]}, 1, 0]}},
            "at_risk": {"$sum": {"$cond": ["$risk", 1, 0]}},
            "upcoming": {"$sum": {"$cond": [
                {"$and": [{"$eq": ["$ref_type", "festival"]},
                          {"$gte": ["$start_date", today]}]}, 1, 0]}},
        }},
    ]
    out = {}
    async for row in _db.map_records.aggregate(pipeline):
        out[row["_id"]] = {
            "records": row["records"], "heritage": row["heritage"],
            "at_risk": row["at_risk"], "upcoming": row["upcoming"],
        }
    return {"regions": out}


@router.get("/regions/{state}")
async def region_profile(state: str):
    docs = await _db.map_records.find({"state": state}, _proj()).to_list(length=2000)
    if not docs:
        return {"state": state, "empty": True, "by_layer": {}, "districts": [],
                "records": [], "total": 0}
    by_layer, districts = {}, set()
    for d in docs:
        by_layer[d["layer"]] = by_layer.get(d["layer"], 0) + 1
        if d.get("district"):
            districts.add(d["district"])
    return {
        "state": state, "empty": False, "total": len(docs),
        "by_layer": by_layer, "districts": sorted(districts),
        "records": [_feature(d)["properties"] | {"lat": d["lat"], "lng": d["lng"]} for d in docs[:60]],
    }


@router.get("/search")
async def map_search(q: str, limit: int = 8):
    if not q.strip():
        return {"groups": []}
    rx = {"$regex": q, "$options": "i"}
    heritage = await _db.map_records.find(
        {"ref_type": "heritage", "$or": [{"name": rx}, {"district": rx}]}, _proj()
    ).limit(limit).to_list(length=limit)
    fests = await _db.map_records.find(
        {"ref_type": "festival", "name": rx}, _proj()
    ).limit(limit).to_list(length=limit)
    states = await _db.map_records.distinct("state", {"state": rx})

    def slim(d):
        return {"id": d["id"], "ref_type": d["ref_type"], "ref_id": d["ref_id"],
                "name": d["name"], "state": d.get("state"), "district": d.get("district"),
                "layer": d["layer"], "lat": d["lat"], "lng": d["lng"], "image": d.get("image")}

    groups = []
    if heritage:
        groups.append({"label": "Heritage", "items": [slim(d) for d in heritage]})
    if fests:
        groups.append({"label": "Festivals", "items": [slim(d) for d in fests]})
    if states:
        groups.append({"label": "Places", "items": [
            {"name": s, "type": "state", "state": s} for s in states[:6] if s]})
    return {"groups": groups}


@router.get("/nearby")
async def map_nearby(lat: float, lng: float, radius: int = 25000, limit: int = 20):
    docs = await _db.map_records.find({
        "location": {"$near": {
            "$geometry": {"type": "Point", "coordinates": [lng, lat]},
            "$maxDistance": radius}}
    }, _proj()).limit(limit).to_list(length=limit)
    out = []
    from math import radians, sin, cos, sqrt, atan2
    for d in docs:
        dlat, dlng = radians(d["lat"] - lat), radians(d["lng"] - lng)
        a = sin(dlat/2)**2 + cos(radians(lat))*cos(radians(d["lat"]))*sin(dlng/2)**2
        km = 6371 * 2 * atan2(sqrt(a), sqrt(1-a))
        p = _feature(d)["properties"]
        p["lat"], p["lng"], p["distance_km"] = d["lat"], d["lng"], round(km, 1)
        out.append(p)
    return {"records": out}


class TrackEvent(BaseModel):
    ref_type: str
    ref_id: str
    event: str = "location_opened"


@router.post("/track")
async def track_event(body: TrackEvent):
    await _db.map_events.insert_one({
        "ref_type": body.ref_type, "ref_id": body.ref_id, "event": body.event,
        "ts": datetime.now(timezone.utc).isoformat(),
    })
    return {"ok": True}


@router.get("/record/{ref_type}/{ref_id}/stats")
async def record_stats(ref_type: str, ref_id: str):
    n = await _db.map_events.count_documents(
        {"ref_type": ref_type, "ref_id": ref_id, "event": "location_opened"})
    return {"explored": n}


class AiSearch(BaseModel):
    query: str


AI_SEARCH_SYSTEM = (
    "You convert a user's natural-language map request about Indian culture into STRICT JSON filters. "
    "Reply with JSON only, no prose, no code fences. Schema: {\"layers\": [str], \"state\": str|null, "
    "\"district\": str|null, \"risk\": bool, \"festival\": str|null, \"month\": int|null, "
    "\"answer\": str}. Valid layers: heritage, festivals, dance, music, food, crafts, languages, "
    "rituals, at_risk. Use full state names (e.g. 'Andhra Pradesh', 'Tamil Nadu', 'Kerala'). "
    "month is 1-12 or null. 'answer' is one short friendly sentence describing what you're showing. "
    "If the user asks about endangered/at-risk/disappearing things set risk=true and layers=[\"at_risk\"]. "
    "If no specific layer is implied, return an empty layers array."
)


@router.post("/ai-search")
async def ai_search(body: AiSearch):

    fallback = {
        "layers": [],
        "state": None,
        "district": None,
        "risk": False,
        "festival": None,
        "month": None,
        "answer": "Showing results on the map."
    }

    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

    if not GEMINI_API_KEY:
        return fallback

    try:
        from google import genai

        client = genai.Client(api_key=GEMINI_API_KEY)

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=AI_SEARCH_SYSTEM + "\n\nUSER QUERY:\n" + body.query,
        )

        text = response.text

        s, e = text.find("{"), text.rfind("}")

        parsed = (
            json.loads(text[s:e + 1])
            if s >= 0 and e > s
            else fallback
        )

        for k, v in fallback.items():
            parsed.setdefault(k, v)

        return parsed

    except Exception as ex:
        logger.exception("ai-search failed")
        return fallback

class AiRegion(BaseModel):
    state: Optional[str] = None
    district: Optional[str] = None
    question: str

@router.post("/ai-region")
async def ai_region(body: AiRegion):

    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

    if not GEMINI_API_KEY:
        raise HTTPException(500, "GEMINI_API_KEY not configured")

    loc = body.district or body.state or "this region"

    q = {"state": body.state} if body.state else {}

    docs = await _db.map_records.find(q, _proj()).limit(40).to_list(length=40)

    ctx = "\n".join(
        f"- {d['name']} ({d['layer']}, {d.get('district') or ''}): {d.get('short','')[:140]}"
        for d in docs
    )

    system = (
        f"You are Virana AI answering about the cultural heritage of {loc}, India. "
        "Be accurate, reverent and concise. Respect regional variation, preserve original names, "
        "never invent facts and note uncertainty. Use the KNOWLEDGE from Virana's database when relevant.\n\n"
        f"KNOWLEDGE:\n{ctx}\n\n"
        f"USER QUESTION:\n{body.question}"
    )

    try:
        from google import genai

        client = genai.Client(api_key=GEMINI_API_KEY)

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=system,
        )

        text = response.text

        return {
            "answer": text,
            "location": loc
        }

    except Exception as ex:
        logger.exception("ai-region failed")
        raise HTTPException(502, f"AI error: {ex}")