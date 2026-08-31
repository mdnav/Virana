import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List

from auth import get_current_user, public_user, verify_password, hash_password, validate_password_strength

router = APIRouter(prefix="/users/me", tags=["users"])
_db = None

def init(db):
    global _db
    _db = db

def now_iso():
    return datetime.now(timezone.utc).isoformat()

SAVE_TYPES = {"HERITAGE", "FESTIVAL", "LANGUAGE", "FOOD", "DANCE", "MUSIC", "TRADITION", "STORY", "AUDIO", "VIDEO"}


async def log_activity(user_id: str, action: str, item_type: str = None, item_id: str = None, meta: dict = None):
    await _db.user_activity.insert_one({
        "id": str(uuid.uuid4()), "user_id": user_id, "action": action,
        "item_type": item_type, "item_id": item_id, "meta": meta or {},
        "created_at": now_iso(),
    })


async def _expand_item(item_type: str, item_id: str):
    if item_type == "FESTIVAL":
        doc = await _db.festivals.find_one({"id": item_id}, {"_id": 0, "id": 1, "name": 1, "image": 1, "state": 1, "start_date": 1, "end_date": 1, "type": 1})
        if doc:
            doc["kind"] = "FESTIVAL"
        return doc
    doc = await _db.heritage.find_one({"id": item_id}, {"_id": 0, "id": 1, "name": 1, "image": 1, "state": 1, "category": 1, "short": 1})
    if doc:
        doc["kind"] = "HERITAGE"
    return doc


# ---------- Profile / account ----------
class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    profile_image: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    preferred_language: Optional[str] = None
    interests: Optional[List[str]] = None

@router.get("")
async def get_me(user: dict = Depends(get_current_user)):
    data = await public_user(user)
    data["stats"] = {
        "explored": await _db.user_activity.count_documents({"user_id": user["id"], "action": "viewed"}),
        "saved": await _db.saved_items.count_documents({"user_id": user["id"]}),
        "contributions": await _db.contributions.count_documents({"user_id": user["id"]}),
        "collections": await _db.user_collections.count_documents({"user_id": user["id"]}),
        "reminders": await _db.festival_reminders.count_documents({"user_id": user["id"]}),
    }
    return data

@router.put("")
async def update_me(req: ProfileUpdate, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    if updates:
        updates["updated_at"] = now_iso()
        await _db.user_profiles.update_one({"user_id": user["id"]}, {"$set": updates})
        if "preferred_language" in updates:
            await _db.user_preferences.update_one({"user_id": user["id"]}, {"$set": {"language": updates["preferred_language"]}})
    return await public_user(user)


class DeleteAccountRequest(BaseModel):
    password: str

@router.delete("")
async def delete_me(req: DeleteAccountRequest, user: dict = Depends(get_current_user)):
    full = await _db.users.find_one({"id": user["id"]})
    if not verify_password(req.password, full["password_hash"]):
        raise HTTPException(status_code=401, detail="Password is incorrect")
    uid = user["id"]
    # Contributions are anonymized, not deleted (heritage data policy)
    await _db.contributions.update_many({"user_id": uid}, {"$set": {"user_id": None, "attribution": "Former contributor"}})
    for coll in (_db.users, _db.user_profiles, _db.user_preferences, _db.saved_items,
                 _db.user_collections, _db.user_activity, _db.user_sessions, _db.festival_reminders):
        key = "id" if coll == _db.users else "user_id"
        await coll.delete_many({key: uid})
    return {"message": "Account deleted"}


class PasswordChange(BaseModel):
    current_password: str
    new_password: str

@router.put("/password")
async def change_password(req: PasswordChange, user: dict = Depends(get_current_user)):
    full = await _db.users.find_one({"id": user["id"]})
    if not verify_password(req.current_password, full["password_hash"]):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    validate_password_strength(req.new_password)
    await _db.users.update_one({"id": user["id"]}, {"$set": {"password_hash": hash_password(req.new_password), "updated_at": now_iso()}})
    return {"message": "Password changed"}


@router.get("/sessions")
async def sessions(user: dict = Depends(get_current_user)):
    docs = await _db.user_sessions.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
    return {"sessions": docs}

@router.post("/sessions/clear")
async def clear_sessions(user: dict = Depends(get_current_user)):
    await _db.user_sessions.delete_many({"user_id": user["id"]})
    return {"message": "Signed out of all devices"}


# ---------- Settings ----------
class SettingsUpdate(BaseModel):
    theme: Optional[str] = None
    language: Optional[str] = None
    notifications: Optional[dict] = None
    privacy: Optional[dict] = None

@router.get("/settings")
async def get_settings(user: dict = Depends(get_current_user)):
    prefs = await _db.user_preferences.find_one({"user_id": user["id"]}, {"_id": 0})
    return prefs or {}

@router.put("/settings")
async def update_settings(req: SettingsUpdate, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    if updates:
        await _db.user_preferences.update_one({"user_id": user["id"]}, {"$set": updates})
        if "language" in updates:
            await _db.user_profiles.update_one({"user_id": user["id"]}, {"$set": {"preferred_language": updates["language"]}})
    prefs = await _db.user_preferences.find_one({"user_id": user["id"]}, {"_id": 0})
    return prefs

@router.put("/notifications")
async def update_notifications(req: dict, user: dict = Depends(get_current_user)):
    await _db.user_preferences.update_one({"user_id": user["id"]}, {"$set": {"notifications": req}})
    return {"message": "Notification preferences saved"}

@router.put("/privacy")
async def update_privacy(req: dict, user: dict = Depends(get_current_user)):
    await _db.user_preferences.update_one({"user_id": user["id"]}, {"$set": {"privacy": req}})
    return {"message": "Privacy preferences saved"}


# ---------- Saved items ----------
class SaveRequest(BaseModel):
    item_type: str
    item_id: str

@router.get("/saved")
async def get_saved(item_type: Optional[str] = None, user: dict = Depends(get_current_user)):
    q = {"user_id": user["id"]}
    if item_type:
        q["item_type"] = item_type.upper()
    docs = await _db.saved_items.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    items = []
    for d in docs:
        expanded = await _expand_item(d["item_type"], d["item_id"])
        if expanded:
            items.append({**d, "item": expanded})
    return {"count": len(items), "items": items}

@router.post("/saved")
async def toggle_save(req: SaveRequest, user: dict = Depends(get_current_user)):
    item_type = req.item_type.upper()
    if item_type not in SAVE_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported item type")
    existing = await _db.saved_items.find_one({"user_id": user["id"], "item_type": item_type, "item_id": req.item_id})
    if existing:
        await _db.saved_items.delete_one({"_id": existing["_id"]})
        await log_activity(user["id"], "unsaved", item_type, req.item_id)
        return {"saved": False}
    await _db.saved_items.insert_one({
        "id": str(uuid.uuid4()), "user_id": user["id"], "item_type": item_type,
        "item_id": req.item_id, "created_at": now_iso(),
    })
    await log_activity(user["id"], "saved", item_type, req.item_id)
    return {"saved": True}

@router.get("/saved/check")
async def check_saved(item_type: str, item_id: str, user: dict = Depends(get_current_user)):
    existing = await _db.saved_items.find_one({"user_id": user["id"], "item_type": item_type.upper(), "item_id": item_id})
    return {"saved": bool(existing)}


# ---------- Activity / recently explored ----------
class TrackRequest(BaseModel):
    item_type: str
    item_id: str

@router.post("/track-view")
async def track_view(req: TrackRequest, user: dict = Depends(get_current_user)):
    await _db.user_activity.delete_many({"user_id": user["id"], "action": "viewed", "item_type": req.item_type.upper(), "item_id": req.item_id})
    await log_activity(user["id"], "viewed", req.item_type.upper(), req.item_id)
    return {"ok": True}

@router.get("/activity")
async def get_activity(limit: int = 40, user: dict = Depends(get_current_user)):
    docs = await _db.user_activity.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    for d in docs:
        if d.get("item_id"):
            d["item"] = await _expand_item(d.get("item_type") or "HERITAGE", d["item_id"])
    return {"activity": docs}

@router.get("/recently-explored")
async def recently_explored(user: dict = Depends(get_current_user)):
    docs = await _db.user_activity.find({"user_id": user["id"], "action": "viewed"}, {"_id": 0}).sort("created_at", -1).limit(12).to_list(12)
    items = []
    for d in docs:
        expanded = await _expand_item(d.get("item_type") or "HERITAGE", d["item_id"])
        if expanded:
            items.append(expanded)
    return {"items": items}


# ---------- Collections ----------
class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class CollectionItem(BaseModel):
    item_type: str
    item_id: str

@router.get("/collections")
async def get_collections(user: dict = Depends(get_current_user)):
    docs = await _db.user_collections.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for c in docs:
        expanded = []
        for it in c.get("items", [])[:4]:
            e = await _expand_item(it["item_type"], it["item_id"])
            if e:
                expanded.append(e)
        c["preview"] = expanded
        c["item_count"] = len(c.get("items", []))
    return {"collections": docs}

@router.post("/collections")
async def create_collection(req: CollectionCreate, user: dict = Depends(get_current_user)):
    doc = {"id": str(uuid.uuid4()), "user_id": user["id"], "name": req.name.strip(),
           "description": req.description or "", "items": [], "created_at": now_iso()}
    await _db.user_collections.insert_one(doc)
    doc.pop("_id", None)
    await log_activity(user["id"], "created_collection", meta={"name": req.name})
    return doc

@router.post("/collections/{collection_id}/items")
async def add_to_collection(collection_id: str, req: CollectionItem, user: dict = Depends(get_current_user)):
    coll = await _db.user_collections.find_one({"id": collection_id, "user_id": user["id"]})
    if not coll:
        raise HTTPException(status_code=404, detail="Collection not found")
    item = {"item_type": req.item_type.upper(), "item_id": req.item_id}
    if item in coll.get("items", []):
        await _db.user_collections.update_one({"id": collection_id}, {"$pull": {"items": item}})
        return {"in_collection": False}
    await _db.user_collections.update_one({"id": collection_id}, {"$push": {"items": item}})
    return {"in_collection": True}

@router.delete("/collections/{collection_id}")
async def delete_collection(collection_id: str, user: dict = Depends(get_current_user)):
    res = await _db.user_collections.delete_one({"id": collection_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Collection not found")
    return {"message": "Collection deleted"}


# ---------- Contributions (dashboard view) ----------
@router.get("/contributions")
async def get_contributions(user: dict = Depends(get_current_user)):
    docs = await _db.contributions.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"contributions": docs}


# ---------- Reminders / notifications ----------
@router.get("/reminders")
async def get_reminders(user: dict = Depends(get_current_user)):
    docs = await _db.festival_reminders.find({"user_id": user["id"]}, {"_id": 0}).to_list(200)
    out = []
    for d in docs:
        fest = await _db.festivals.find_one({"id": d["festival_id"]}, {"_id": 0, "id": 1, "name": 1, "image": 1, "start_date": 1, "end_date": 1, "state": 1})
        if fest:
            out.append(fest)
    out.sort(key=lambda f: f["start_date"])
    return {"reminders": out}

@router.get("/notifications")
async def notifications(user: dict = Depends(get_current_user)):
    prefs = await _db.user_preferences.find_one({"user_id": user["id"]}) or {}
    notifs = []
    if (prefs.get("notifications") or {}).get("festival_reminders", True):
        today = datetime.now(timezone.utc).date()
        docs = await _db.festival_reminders.find({"user_id": user["id"]}, {"_id": 0}).to_list(200)
        for d in docs:
            fest = await _db.festivals.find_one({"id": d["festival_id"]}, {"_id": 0})
            if not fest:
                continue
            start = datetime.fromisoformat(fest["start_date"]).date()
            days = (start - today).days
            if 0 <= days <= 21:
                msg = f"{fest['name']} begins today!" if days == 0 else f"{fest['name']} begins in {days} day{'s' if days != 1 else ''}."
                notifs.append({"type": "festival_reminder", "festival_id": fest["id"], "image": fest.get("image"),
                               "message": msg, "days_away": days, "date": fest["start_date"]})
    notifs.sort(key=lambda n: n.get("days_away", 99))
    return {"count": len(notifs), "notifications": notifs}


@router.get("/export")
async def export_data(user: dict = Depends(get_current_user)):
    uid = user["id"]
    return {
        "user": await public_user(user),
        "saved_items": await _db.saved_items.find({"user_id": uid}, {"_id": 0}).to_list(1000),
        "collections": await _db.user_collections.find({"user_id": uid}, {"_id": 0}).to_list(200),
        "activity": await _db.user_activity.find({"user_id": uid}, {"_id": 0}).to_list(2000),
        "reminders": await _db.festival_reminders.find({"user_id": uid}, {"_id": 0}).to_list(200),
        "exported_at": now_iso(),
    }
