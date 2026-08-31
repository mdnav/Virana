import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional

from auth import get_current_user

router = APIRouter(prefix="/festivals", tags=["festivals"])
_db = None

def init(db):
    global _db
    _db = db

LIST_FIELDS = {"_id": 0, "id": 1, "name": 1, "type": 1, "start_date": 1, "end_date": 1, "months": 1,
               "region": 1, "state": 1, "district": 1, "lat": 1, "lng": 1, "description": 1,
               "image": 1, "verification": 1, "variations": 1}


@router.get("")
async def list_festivals(month: Optional[int] = None, state: Optional[str] = None,
                         type: Optional[str] = None, q: Optional[str] = None,
                         upcoming: bool = False, limit: int = 200):
    query = {}
    if month:
        query["months"] = month
    if state:
        query["$or"] = [{"state": state}, {"state": "Pan-India"}]
    if type:
        query["type"] = type
    if q and q.strip():
        query["$and"] = [{"$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"state": {"$regex": q, "$options": "i"}},
            {"region": {"$regex": q, "$options": "i"}},
        ]}]
    if upcoming:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        query["end_date"] = {"$gte": today}
    docs = await _db.festivals.find(query, LIST_FIELDS).sort("start_date", 1).limit(limit).to_list(limit)
    return {"count": len(docs), "festivals": docs}


@router.get("/upcoming")
async def upcoming_festivals(limit: int = 6):
    today = datetime.now(timezone.utc).date()
    today_s = today.strftime("%Y-%m-%d")
    docs = await _db.festivals.find({"end_date": {"$gte": today_s}}, LIST_FIELDS).sort("start_date", 1).limit(limit * 2).to_list(limit * 2)
    out = []
    for d in docs[:limit]:
        start = datetime.fromisoformat(d["start_date"]).date()
        d["days_away"] = max(0, (start - today).days)
        d["ongoing"] = start <= today
        out.append(d)
    return {"festivals": out}


@router.get("/{festival_id}")
async def get_festival(festival_id: str):
    doc = await _db.festivals.find_one({"id": festival_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Festival not found")
    related = []
    for hid in doc.get("related_heritage", []):
        h = await _db.heritage.find_one({"id": hid}, {"_id": 0, "id": 1, "name": 1, "image": 1, "category": 1, "state": 1, "short": 1, "lat": 1, "lng": 1, "preservation": 1, "status": 1})
        if h:
            related.append(h)
    doc["related_heritage_records"] = related
    today = datetime.now(timezone.utc).date()
    start = datetime.fromisoformat(doc["start_date"]).date()
    doc["days_away"] = (start - today).days
    return doc


@router.post("/{festival_id}/remind")
async def toggle_reminder(festival_id: str, user: dict = Depends(get_current_user)):
    fest = await _db.festivals.find_one({"id": festival_id})
    if not fest:
        raise HTTPException(status_code=404, detail="Festival not found")
    existing = await _db.festival_reminders.find_one({"user_id": user["id"], "festival_id": festival_id})
    if existing:
        await _db.festival_reminders.delete_one({"_id": existing["_id"]})
        return {"reminded": False}
    await _db.festival_reminders.insert_one({
        "id": str(uuid.uuid4()), "user_id": user["id"], "festival_id": festival_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"reminded": True}


@router.get("/{festival_id}/reminder-status")
async def reminder_status(festival_id: str, user: dict = Depends(get_current_user)):
    existing = await _db.festival_reminders.find_one({"user_id": user["id"], "festival_id": festival_id})
    return {"reminded": bool(existing)}
