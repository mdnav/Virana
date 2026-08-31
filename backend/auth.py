import os, re, secrets, uuid
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel, Field
from typing import Optional

JWT_ALGORITHM = "HS256"
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

router = APIRouter(prefix="/auth", tags=["auth"])
_db = None

def init(db):
    global _db
    _db = db


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "type": "access",
               "exp": datetime.now(timezone.utc) + timedelta(hours=12)}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "type": "refresh",
               "exp": datetime.now(timezone.utc) + timedelta(days=30)}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def validate_password_strength(pw: str):
    if len(pw) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    if not re.search(r"[A-Za-z]", pw) or not re.search(r"\d", pw):
        raise HTTPException(status_code=400, detail="Password must contain both letters and numbers")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


async def _get_user_from_token(token: str):
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")
    user = await _db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user.get("status") == "SUSPENDED":
        raise HTTPException(status_code=403, detail="Account suspended")
    return user


def _extract_token(request: Request) -> Optional[str]:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return request.cookies.get("access_token")


async def get_current_user(request: Request) -> dict:
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return await _get_user_from_token(token)


async def get_optional_user(request: Request) -> Optional[dict]:
    token = _extract_token(request)
    if not token:
        return None
    try:
        return await _get_user_from_token(token)
    except HTTPException:
        return None


async def public_user(user: dict) -> dict:
    profile = await _db.user_profiles.find_one({"user_id": user["id"]}, {"_id": 0}) or {}
    prefs = await _db.user_preferences.find_one({"user_id": user["id"]}, {"_id": 0}) or {}
    return {
        "id": user["id"], "email": user["email"],
        "email_verified": user.get("email_verified", False),
        "status": user.get("status", "UNVERIFIED"),
        "created_at": user.get("created_at"),
        "last_login_at": user.get("last_login_at"),
        "display_name": profile.get("display_name", ""),
        "profile_image": profile.get("profile_image"),
        "bio": profile.get("bio", ""),
        "location": profile.get("location", ""),
        "interests": profile.get("interests", []),
        "preferred_language": profile.get("preferred_language", "en"),
        "preferences": {
            "theme": prefs.get("theme", "dark"),
            "language": prefs.get("language", profile.get("preferred_language", "en")),
            "notifications": prefs.get("notifications", {}),
            "privacy": prefs.get("privacy", {}),
        },
    }


DEFAULT_NOTIFICATIONS = {
    "festival_reminders": True, "new_heritage": True, "contribution_updates": True,
    "comment_replies": True, "community_activity": False, "recommendations": True,
    "announcements": True,
}
DEFAULT_PRIVACY = {
    "profile_visibility": "public", "contribution_attribution": True,
    "activity_visibility": "private", "personalized_recommendations": True,
    "location_access": False,
}


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=80)
    email: str
    password: str
    confirm_password: str
    preferred_language: str = "en"
    profile_image: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str
    remember_me: bool = False

class RefreshRequest(BaseModel):
    refresh_token: str

class VerifyEmailRequest(BaseModel):
    token: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/register")
async def register(req: RegisterRequest):
    email = req.email.strip().lower()
    if not EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address")
    if req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    validate_password_strength(req.password)
    if await _db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user_id = str(uuid.uuid4())
    await _db.users.insert_one({
        "id": user_id, "email": email, "password_hash": hash_password(req.password),
        "email_verified": False, "status": "UNVERIFIED", "role": "user",
        "created_at": now_iso(), "updated_at": now_iso(), "last_login_at": now_iso(),
    })
    await _db.user_profiles.insert_one({
        "user_id": user_id, "display_name": req.full_name.strip(),
        "profile_image": req.profile_image, "bio": "", "location": "",
        "interests": [], "preferred_language": req.preferred_language,
        "created_at": now_iso(), "updated_at": now_iso(),
    })
    await _db.user_preferences.insert_one({
        "user_id": user_id, "theme": "dark", "language": req.preferred_language,
        "notifications": DEFAULT_NOTIFICATIONS, "privacy": DEFAULT_PRIVACY,
    })

    verify_token = secrets.token_urlsafe(32)
    await _db.email_verification_tokens.insert_one({
        "token": verify_token, "user_id": user_id, "used": False,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=3),
    })

    user = await _db.users.find_one({"id": user_id}, {"_id": 0})
    return {
        "access_token": create_access_token(user_id, email),
        "refresh_token": create_refresh_token(user_id),
        "user": await public_user(user),
        "verification_token": verify_token,
        "message": "Account created. Please verify your email.",
    }


LOCKOUT_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

@router.post("/login")
async def login(req: LoginRequest, request: Request):
    email = req.email.strip().lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"

    attempt = await _db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= LOCKOUT_ATTEMPTS:
        locked_until = attempt.get("locked_until")
        if locked_until and datetime.fromisoformat(locked_until) > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in a few minutes.")
        await _db.login_attempts.delete_one({"identifier": identifier})

    user = await _db.users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_password(req.password, user["password_hash"]):
        await _db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1},
             "$set": {"locked_until": (datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)).isoformat()}},
            upsert=True)
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if user.get("status") == "SUSPENDED":
        raise HTTPException(status_code=403, detail="This account has been suspended")

    await _db.login_attempts.delete_one({"identifier": identifier})
    await _db.users.update_one({"id": user["id"]}, {"$set": {"last_login_at": now_iso()}})
    await _db.user_sessions.insert_one({
        "id": str(uuid.uuid4()), "user_id": user["id"], "ip": ip,
        "user_agent": request.headers.get("user-agent", "")[:200],
        "created_at": now_iso(),
    })
    return {
        "access_token": create_access_token(user["id"], email),
        "refresh_token": create_refresh_token(user["id"]),
        "user": await public_user(user),
    }


@router.post("/logout")
async def logout():
    return {"message": "Signed out"}


@router.post("/refresh")
async def refresh(req: RefreshRequest):
    try:
        payload = jwt.decode(req.refresh_token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")
    user = await _db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return {"access_token": create_access_token(user["id"], user["email"])}


@router.post("/verify-email")
async def verify_email(req: VerifyEmailRequest):
    rec = await _db.email_verification_tokens.find_one({"token": req.token})
    if not rec or rec.get("used"):
        raise HTTPException(status_code=400, detail="This verification link is invalid or has already been used")
    expires = rec["expires_at"]
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="This verification link has expired")
    await _db.email_verification_tokens.update_one({"token": req.token}, {"$set": {"used": True}})
    await _db.users.update_one({"id": rec["user_id"]},
                               {"$set": {"email_verified": True, "status": "VERIFIED", "updated_at": now_iso()}})
    return {"message": "Email verified successfully"}


@router.post("/resend-verification")
async def resend_verification(user: dict = Depends(get_current_user)):
    if user.get("email_verified"):
        return {"message": "Email already verified"}
    token = secrets.token_urlsafe(32)
    await _db.email_verification_tokens.insert_one({
        "token": token, "user_id": user["id"], "used": False,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=3),
    })
    return {"verification_token": token}


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    email = req.email.strip().lower()
    user = await _db.users.find_one({"email": email})
    resp = {"message": "If an account exists for this email, a reset link has been generated."}
    if user:
        token = secrets.token_urlsafe(32)
        await _db.password_reset_tokens.insert_one({
            "token": token, "user_id": user["id"], "used": False,
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
        })
        resp["reset_token"] = token
    return resp


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    rec = await _db.password_reset_tokens.find_one({"token": req.token})
    if not rec or rec.get("used"):
        raise HTTPException(status_code=400, detail="This reset link is invalid or has already been used")
    expires = rec["expires_at"]
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="This reset link has expired")
    validate_password_strength(req.new_password)
    await _db.password_reset_tokens.update_one({"token": req.token}, {"$set": {"used": True}})
    await _db.users.update_one({"id": rec["user_id"]},
                               {"$set": {"password_hash": hash_password(req.new_password), "updated_at": now_iso()}})
    return {"message": "Password updated. You can now sign in."}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return await public_user(user)


async def seed_demo_user():
    email = "demo@virana.in"
    existing = await _db.users.find_one({"email": email})
    if existing:
        if not verify_password("Virana@123", existing["password_hash"]):
            await _db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password("Virana@123")}})
        return
    user_id = str(uuid.uuid4())
    await _db.users.insert_one({
        "id": user_id, "email": email, "password_hash": hash_password("Virana@123"),
        "email_verified": True, "status": "VERIFIED", "role": "user",
        "created_at": now_iso(), "updated_at": now_iso(), "last_login_at": now_iso(),
    })
    await _db.user_profiles.insert_one({
        "user_id": user_id, "display_name": "Demo Explorer", "profile_image": None,
        "bio": "Wandering India's living heritage.", "location": "Hyderabad, India",
        "interests": ["temples", "festivals", "food"], "preferred_language": "en",
        "created_at": now_iso(), "updated_at": now_iso(),
    })
    await _db.user_preferences.insert_one({
        "user_id": user_id, "theme": "dark", "language": "en",
        "notifications": DEFAULT_NOTIFICATIONS, "privacy": DEFAULT_PRIVACY,
    })
