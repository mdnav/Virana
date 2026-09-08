from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, uuid, json, base64
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone

from heritage_seed import HERITAGE_SEED, STATES, CATEGORIES
from festival_seed import FESTIVAL_SEED

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import auth as auth_module
import users as users_module
import festivals as festivals_module
import map_service as map_module

MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Virana API")
api_router = APIRouter(prefix="/api")

logger = logging.getLogger("virana")
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(name)s] %(levelname)s: %(message)s')


# ---------- Models ----------
class ChatRequest(BaseModel):
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    message: str

class ChatResponse(BaseModel):
    session_id: str
    reply: str
    sources: List[str] = []

class LensRequest(BaseModel):
    image_base64: str  # no data: prefix
    mime_type: str = "image/jpeg"

class LensResult(BaseModel):
    identified_name: str
    confidence: int
    era: Optional[str] = None
    location: Optional[str] = None
    description: str
    cultural_significance: Optional[str] = None
    matched_record_id: Optional[str] = None
    possible_matches: List[str] = []


# ---------- Startup: seed DB ----------
auth_module.init(db)
users_module.init(db)
festivals_module.init(db)
map_module.init(db)


@app.on_event("startup")
async def seed_db():
    try:
        count = await db.heritage.count_documents({})
        if count == 0:
            await db.heritage.insert_many(HERITAGE_SEED)
            logger.info(f"Seeded {len(HERITAGE_SEED)} heritage records")
        # Always refresh reference data
        await db.states.delete_many({})
        await db.states.insert_many(STATES)
        await db.categories.delete_many({})
        await db.categories.insert_many(CATEGORIES)
        # Festivals: always refresh from seed (canonical dataset)
        await db.festivals.delete_many({})
        await db.festivals.insert_many([dict(f) for f in FESTIVAL_SEED])
        logger.info(f"Seeded {len(FESTIVAL_SEED)} festivals")
        # Indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("id")
        await db.login_attempts.create_index("identifier")
        await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
        await db.email_verification_tokens.create_index("expires_at", expireAfterSeconds=0)
        await db.saved_items.create_index([("user_id", 1), ("item_type", 1), ("item_id", 1)])
        await db.festivals.create_index("start_date")
        await map_module.build_map_records()
        await auth_module.seed_demo_user()
    except Exception as e:
        logger.exception(f"Seeding failed: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


def clean(doc):
    if doc and "_id" in doc:
        doc.pop("_id", None)
    return doc


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"name": "Virana API", "tagline": "Explore. Experience. Preserve."}


@api_router.get("/heritage")
async def list_heritage(category: Optional[str] = None, state: Optional[str] = None,
                        preservation: Optional[str] = None, limit: int = 200):
    q = {}
    if category:
        q["category"] = category
    if state:
        q["state"] = state
    if preservation:
        q["preservation"] = preservation
    docs = await db.heritage.find(q, {"_id": 0}).limit(limit).to_list(length=limit)
    return {"count": len(docs), "records": docs}


@api_router.get("/heritage/search")
async def search_heritage(q: str, limit: int = 20):
    if not q.strip():
        return {"count": 0, "records": []}
    query = {
        "$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"short": {"$regex": q, "$options": "i"}},
            {"state": {"$regex": q, "$options": "i"}},
            {"district": {"$regex": q, "$options": "i"}},
            {"category": {"$regex": q, "$options": "i"}},
        ]
    }
    docs = await db.heritage.find(query, {"_id": 0}).limit(limit).to_list(length=limit)
    return {"count": len(docs), "records": docs}


@api_router.get("/heritage/{record_id}")
async def get_heritage(record_id: str):
    doc = await db.heritage.find_one({"id": record_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Heritage record not found")
    # Related: same state or same category (excluding itself)
    related = await db.heritage.find(
        {"id": {"$ne": record_id},
         "$or": [{"state": doc.get("state")}, {"category": doc.get("category")}]},
        {"_id": 0, "id": 1, "name": 1, "image": 1, "category": 1, "state": 1, "short": 1}
    ).limit(6).to_list(length=6)
    doc["related"] = related
    return doc


@api_router.get("/states")
async def list_states():
    docs = await db.states.find({}, {"_id": 0}).to_list(length=200)
    return {"states": docs}


@api_router.get("/categories")
async def list_categories():
    docs = await db.categories.find({}, {"_id": 0}).to_list(length=100)
    return {"categories": docs}


@api_router.get("/stats")
async def get_stats():
    total = await db.heritage.count_documents({})
    at_risk = await db.heritage.count_documents({"preservation": "AT_RISK"})
    by_cat = {}
    async for c in db.categories.find({}, {"_id": 0}):
        by_cat[c["id"]] = await db.heritage.count_documents({"category": c["id"]})
    return {
        "total_records": total,
        "at_risk": at_risk,
        "categories": by_cat,
        "states_covered": len(await db.heritage.distinct("state")),
    }


# ---------- AI: Ask Virana ----------
def get_context_snippets(query: str, limit: int = 5):
    """Very light keyword-match retrieval to ground the LLM."""
    q_lower = query.lower()
    matches = []
    for r in HERITAGE_SEED:
        blob = (r["name"] + " " + r.get("short", "") + " " + r.get("state", "") + " " +
                (r.get("district") or "") + " " + r.get("category", "")).lower()
        score = 0
        for word in q_lower.split():
            if len(word) < 3:
                continue
            if word in blob:
                score += blob.count(word)
        if score > 0:
            matches.append((score, r))
    matches.sort(key=lambda x: -x[0])
    return [m[1] for m in matches[:limit]]


SYSTEM_PROMPT = (
    "You are Virana AI, a reverent, factual, culturally nuanced scholar of Indian heritage. "
    "You help users understand India's monuments, temples, festivals, dances, music, food, "
    "languages, crafts and endangered traditions. "
    "Always: (1) be accurate and cite sources or note uncertainty, (2) respect regional variation, "
    "(3) preserve original names and terms with brief translation, (4) keep answers structured with "
    "short paragraphs and a 'Key facts' bullet list when relevant. Never invent historical facts. "
    "If asked about something outside Indian cultural heritage, gently redirect. "
    "Use the provided KNOWLEDGE snippets from the Virana database when they are relevant."
)


@api_router.post("/ai/ask", response_model=ChatResponse)
async def ai_ask(req: ChatRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY not configured"
        )

    snippets = get_context_snippets(req.message)

    context_text = ""
    sources = []

    for s in snippets:
        context_text += (
            f"\n- {s['name']} ({s.get('state', '')}): "
            f"{s.get('short', '')}"
        )
        sources.append(s["name"])

    system_message = SYSTEM_PROMPT + (
        "\n\nKNOWLEDGE (from Virana database):" + context_text
        if context_text
        else ""
    )

    try:
        from google import genai

        client = genai.Client(api_key=GEMINI_API_KEY)

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=system_message + "\n\nUSER QUESTION:\n" + req.message,
        )

        text = response.text

    except Exception as e:
        logger.exception("Gemini call failed")
        raise HTTPException(
            status_code=502,
            detail=f"AI service error: {e}"
        )

    # persist message
    try:
        await db.chat_messages.insert_one({
            "session_id": req.session_id,
            "role": "user",
            "text": req.message,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

        await db.chat_messages.insert_one({
            "session_id": req.session_id,
            "role": "assistant",
            "text": text,
            "sources": sources,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    except Exception:
        pass

    return ChatResponse(
        session_id=req.session_id,
        reply=text,
        sources=sources
    )


# ---------- AI: HeritageLens (vision) ----------
LENS_SYSTEM = (
    "You are HeritageLens, a visual AI that identifies Indian cultural heritage — monuments, "
    "temples, forts, palaces, traditional art forms, sculptures, dance costumes, or artifacts. "
    "Analyze the given image and reply with STRICT JSON only, no code fences, no prose outside JSON. "
    "Schema: {\"identified_name\": str, \"confidence\": int (0-100), \"era\": str, "
    "\"location\": str, \"description\": str (2-3 sentences), "
    "\"cultural_significance\": str (1-2 sentences), \"possible_matches\": [str]}. "
    "If the image is NOT Indian heritage, set identified_name to 'Not Indian heritage' and confidence to 0. "
    "If unsure, list up to 3 possible_matches and use a lower confidence."
)


async def heritage_lens(req: LensRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY not configured"
        )

    try:
        from google import genai
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Google GenAI SDK not available: {e}"
        )

    # Strip data URL prefix if present
    b64 = req.image_base64
    if "," in b64 and b64.startswith("data:"):
        b64 = b64.split(",", 1)[1]

    client = genai.Client(api_key=GEMINI_API_KEY)

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                {
                    "inline_data": {
                        "mime_type": req.mime_type,
                        "data": b64,
                    }
                },
                LENS_SYSTEM + "\n\nIdentify this Indian heritage subject and return STRICT JSON."
            ],
        )

        text = response.text

    except Exception as e:
        logger.exception("Gemini vision failed")
        raise HTTPException(
            status_code=502,
            detail=f"Vision AI error: {e}"
        )
    # Parse JSON (be lenient)
    parsed = None
    for candidate in (text, text.strip().strip("`")):
        try:
            # Try to find JSON braces
            start = candidate.find("{")
            end = candidate.rfind("}")
            if start >= 0 and end > start:
                parsed = json.loads(candidate[start:end+1])
                break
        except Exception:
            continue
    if not parsed:
        parsed = {
            "identified_name": "Unable to parse",
            "confidence": 0,
            "era": None,
            "location": None,
            "description": text[:500],
            "cultural_significance": None,
            "possible_matches": [],
        }

    # Fuzzy-match to a DB record for CTA linking
    matched_id = None
    name_lower = (parsed.get("identified_name") or "").lower()
    if name_lower and name_lower != "not indian heritage":
        for r in HERITAGE_SEED:
            if r["name"].lower() in name_lower or name_lower in r["name"].lower():
                matched_id = r["id"]
                break

    return LensResult(
        identified_name=parsed.get("identified_name") or "Unknown",
        confidence=int(parsed.get("confidence") or 0),
        era=parsed.get("era"),
        location=parsed.get("location"),
        description=parsed.get("description") or "",
        cultural_significance=parsed.get("cultural_significance"),
        matched_record_id=matched_id,
        possible_matches=parsed.get("possible_matches") or [],
    )


api_router.include_router(auth_module.router)
api_router.include_router(users_module.router)
api_router.include_router(festivals_module.router)
api_router.include_router(map_module.router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
