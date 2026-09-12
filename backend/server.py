from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import uuid
import logging
import bcrypt
import jwt

# ------------------------------------------------------------------ setup
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGORITHM = "HS256"
DEPOSIT_DEFAULT = 30.0
DISPOSABLE_COST = 6.0          # cost of one single-use container (INR)
WASTE_PER_CONTAINER_G = 25.0   # grams of plastic waste avoided per reuse
CO2_PER_CONTAINER_G = 33.0     # grams CO2 avoided per reuse

app = FastAPI(title="ReLoop API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("reloop")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(hours=12), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=43200, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none", max_age=604800, path="/")


def clean_user(u: dict) -> dict:
    u = dict(u)
    u.pop("_id", None)
    u.pop("password_hash", None)
    return u


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return clean_user(user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def require_roles(*roles):
    async def checker(user: dict = Depends(get_current_user)) -> dict:
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return checker


# ------------------------------------------------------------------ models
class RegisterInput(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = ""
    password: str
    student_code: Optional[str] = ""


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class ContainerInput(BaseModel):
    container_code: str
    rfid_uid: str
    capacity: str = "500ml"
    material: str = "Food-grade PP"
    empty_weight: float = 240.0
    condition: str = "good"


class IssueInput(BaseModel):
    student_id: str
    container_id: str
    deposit_amount: Optional[float] = None


class RfidScanInput(BaseModel):
    rfid_uid: str


class WeightVerifyInput(BaseModel):
    container_id: str
    measured_weight: float


class SettingsInput(BaseModel):
    deposit_amount: float
    weight_tolerance: float
    disposable_cost: float


class UserUpdateInput(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None


# ------------------------------------------------------------------ settings helper
async def get_settings() -> dict:
    s = await db.settings.find_one({"id": "global"})
    if not s:
        s = {"id": "global", "deposit_amount": DEPOSIT_DEFAULT, "weight_tolerance": 15.0, "disposable_cost": DISPOSABLE_COST}
        await db.settings.insert_one(dict(s))
    s.pop("_id", None)
    return s


# ------------------------------------------------------------------ auth routes
@api_router.post("/auth/register")
async def register(data: RegisterInput, response: Response):
    email = data.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    uid = str(uuid.uuid4())
    doc = {
        "id": uid, "name": data.name, "email": email, "phone": data.phone or "",
        "password_hash": hash_password(data.password), "role": "student",
        "student_code": data.student_code or f"STU{uid[:4].upper()}",
        "wallet_balance": 0.0, "created_at": now_iso(),
    }
    await db.users.insert_one(dict(doc))
    access, refresh = create_access_token(uid, email), create_refresh_token(uid)
    set_auth_cookies(response, access, refresh)
    return {"user": clean_user(doc), "access_token": access}


@api_router.post("/auth/login")
async def login(data: LoginInput, response: Response):
    email = data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    access, refresh = create_access_token(user["id"], email), create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return {"user": clean_user(user), "access_token": access}


@api_router.post("/auth/logout")
async def logout(response: Response, user: dict = Depends(get_current_user)):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access = create_access_token(user["id"], user["email"])
        response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=43200, path="/")
        return {"access_token": access}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


# ------------------------------------------------------------------ user management (admin)
@api_router.get("/users")
async def list_users(role: Optional[str] = None, user: dict = Depends(require_roles("admin", "staff"))):
    q = {}
    if role:
        q["role"] = role
    users = await db.users.find(q, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(1000)
    return users


@api_router.get("/students")
async def list_students(user: dict = Depends(require_roles("admin", "staff"))):
    return await db.users.find({"role": "student"}, {"_id": 0, "password_hash": 0}).sort("name", 1).to_list(1000)


@api_router.put("/users/{uid}")
async def update_user(uid: str, data: UserUpdateInput, user: dict = Depends(require_roles("admin"))):
    upd = {k: v for k, v in data.model_dump().items() if v is not None}
    if not upd:
        raise HTTPException(status_code=400, detail="Nothing to update")
    await db.users.update_one({"id": uid}, {"$set": upd})
    doc = await db.users.find_one({"id": uid})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return clean_user(doc)


@api_router.delete("/users/{uid}")
async def delete_user(uid: str, user: dict = Depends(require_roles("admin"))):
    await db.users.delete_one({"id": uid})
    return {"message": "User deleted"}


# ------------------------------------------------------------------ student self endpoints
@api_router.get("/students/me/container")
async def my_container(user: dict = Depends(get_current_user)):
    txn = await db.container_transactions.find_one({"student_id": user["id"], "status": "Issued"}, {"_id": 0})
    if not txn:
        return None
    container = await db.containers.find_one({"id": txn["container_id"]}, {"_id": 0})
    return {"transaction": txn, "container": container}


@api_router.get("/students/me/transactions")
async def my_wallet_txns(user: dict = Depends(get_current_user)):
    return await db.wallet_transactions.find({"student_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.get("/students/me/returns")
async def my_returns(user: dict = Depends(get_current_user)):
    return await db.container_transactions.find(
        {"student_id": user["id"], "status": {"$in": ["Returned", "Refunded"]}}, {"_id": 0}
    ).sort("returned_at", -1).to_list(500)


@api_router.get("/students/me/summary")
async def my_summary(user: dict = Depends(get_current_user)):
    returns = await db.container_transactions.count_documents({"student_id": user["id"], "status": {"$in": ["Returned", "Refunded"]}})
    active = await db.container_transactions.count_documents({"student_id": user["id"], "status": "Issued"})
    total = await db.container_transactions.count_documents({"student_id": user["id"]})
    fresh = await db.users.find_one({"id": user["id"]})
    return {
        "reuse_cycles": returns,
        "active_containers": active,
        "total_transactions": total,
        "wallet_balance": fresh.get("wallet_balance", 0.0),
        "disposables_avoided": returns,
        "waste_avoided_g": round(returns * WASTE_PER_CONTAINER_G, 1),
        "co2_avoided_g": round(returns * CO2_PER_CONTAINER_G, 1),
    }


# ------------------------------------------------------------------ containers
@api_router.get("/containers")
async def list_containers(status: Optional[str] = None, user: dict = Depends(require_roles("admin", "staff"))):
    q = {}
    if status:
        q["status"] = status
    return await db.containers.find(q, {"_id": 0}).sort("container_code", 1).to_list(2000)


@api_router.post("/containers")
async def create_container(data: ContainerInput, user: dict = Depends(require_roles("admin"))):
    if await db.containers.find_one({"$or": [{"container_code": data.container_code}, {"rfid_uid": data.rfid_uid}]}):
        raise HTTPException(status_code=400, detail="Container code or RFID already exists")
    doc = {
        "id": str(uuid.uuid4()), **data.model_dump(),
        "status": "Available", "usage_count": 0, "last_cleaned_at": now_iso(),
        "current_holder": None, "current_holder_name": None, "created_at": now_iso(),
    }
    await db.containers.insert_one(dict(doc))
    doc.pop("_id", None)
    return doc


@api_router.put("/containers/{cid}")
async def update_container(cid: str, data: ContainerInput, user: dict = Depends(require_roles("admin"))):
    await db.containers.update_one({"id": cid}, {"$set": data.model_dump()})
    doc = await db.containers.find_one({"id": cid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Container not found")
    return doc


@api_router.delete("/containers/{cid}")
async def delete_container(cid: str, user: dict = Depends(require_roles("admin"))):
    await db.containers.delete_one({"id": cid})
    return {"message": "Container deleted"}


# ------------------------------------------------------------------ issue container
@api_router.post("/containers/issue")
async def issue_container(data: IssueInput, user: dict = Depends(require_roles("admin", "staff"))):
    settings = await get_settings()
    deposit = data.deposit_amount if data.deposit_amount is not None else settings["deposit_amount"]
    student = await db.users.find_one({"id": data.student_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    container = await db.containers.find_one({"id": data.container_id})
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
    if container["status"] not in ("Available", "Ready"):
        raise HTTPException(status_code=400, detail=f"Container is {container['status']}, not available for issue")

    ts = now_iso()
    txn = {
        "id": str(uuid.uuid4()), "student_id": student["id"], "student_name": student["name"],
        "container_id": container["id"], "container_code": container["container_code"],
        "rfid_uid": container["rfid_uid"], "deposit_amount": deposit, "refund_amount": None,
        "issued_at": ts, "returned_at": None, "status": "Issued",
        "issued_by": user["name"],
    }
    await db.container_transactions.insert_one(dict(txn))
    await db.containers.update_one({"id": container["id"]}, {"$set": {
        "status": "Issued", "current_holder": student["id"], "current_holder_name": student["name"]
    }})
    # deposit is charged against wallet
    new_balance = round(student.get("wallet_balance", 0.0) - deposit, 2)
    await db.users.update_one({"id": student["id"]}, {"$set": {"wallet_balance": new_balance}})
    await db.wallet_transactions.insert_one({
        "id": str(uuid.uuid4()), "student_id": student["id"], "transaction_type": "Deposit",
        "amount": -deposit, "reference": txn["id"], "balance_after": new_balance,
        "description": f"Deposit held for container {container['container_code']}", "created_at": ts,
    })
    txn.pop("_id", None)
    return txn


# ------------------------------------------------------------------ kiosk: rfid scan
@api_router.post("/rfid/scan")
async def rfid_scan(data: RfidScanInput):
    container = await db.containers.find_one({"rfid_uid": data.rfid_uid}, {"_id": 0})
    if not container:
        raise HTTPException(status_code=404, detail="Unknown RFID tag")
    txn = await db.container_transactions.find_one({"container_id": container["id"], "status": "Issued"}, {"_id": 0})
    if not txn:
        raise HTTPException(status_code=400, detail="Container is not currently issued (duplicate or invalid return)")
    return {
        "container": container, "transaction": txn,
        "expected_weight": container["empty_weight"],
        "rfid_verified": True,
        "student_name": txn["student_name"],
        "deposit_amount": txn["deposit_amount"],
    }


# ------------------------------------------------------------------ kiosk: weight verify + refund
@api_router.post("/weight/verify")
async def weight_verify(data: WeightVerifyInput):
    settings = await get_settings()
    tolerance = settings["weight_tolerance"]
    container = await db.containers.find_one({"id": data.container_id})
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
    txn = await db.container_transactions.find_one({"container_id": container["id"], "status": "Issued"})
    if not txn:
        raise HTTPException(status_code=400, detail="No active issue found for this container")

    expected = container["empty_weight"]
    diff = round(data.measured_weight - expected, 1)
    weight_ok = abs(diff) <= tolerance
    ts = now_iso()

    verification = {
        "id": str(uuid.uuid4()), "container_id": container["id"], "rfid_uid": container["rfid_uid"],
        "measured_weight": data.measured_weight, "expected_weight": expected, "weight_difference": diff,
        "rfid_verified": True, "weight_verified": weight_ok,
        "verification_status": "Verified" if weight_ok else "Failed", "created_at": ts,
    }
    await db.return_verifications.insert_one(dict(verification))
    verification.pop("_id", None)

    if not weight_ok:
        return {"verified": False, "verification": verification,
                "message": "Weight mismatch — please empty the container and retry."}

    # success: refund + status -> Washing
    refund = txn["deposit_amount"]
    await db.container_transactions.update_one({"id": txn["id"]}, {"$set": {
        "status": "Refunded", "returned_at": ts, "refund_amount": refund
    }})
    await db.containers.update_one({"id": container["id"]}, {"$set": {
        "status": "Washing", "current_holder": None, "current_holder_name": None,
    }, "$inc": {"usage_count": 1}})
    student = await db.users.find_one({"id": txn["student_id"]})
    new_balance = round(student.get("wallet_balance", 0.0) + refund, 2)
    await db.users.update_one({"id": student["id"]}, {"$set": {"wallet_balance": new_balance}})
    await db.wallet_transactions.insert_one({
        "id": str(uuid.uuid4()), "student_id": student["id"], "transaction_type": "Refund",
        "amount": refund, "reference": txn["id"], "balance_after": new_balance,
        "description": f"Refund for returned container {container['container_code']}", "created_at": ts,
    })
    return {"verified": True, "verification": verification, "refund_amount": refund,
            "student_name": txn["student_name"], "new_balance": new_balance,
            "message": "Return verified. Deposit refunded."}


# ------------------------------------------------------------------ transactions
@api_router.get("/transactions")
async def all_transactions(user: dict = Depends(require_roles("admin", "staff"))):
    return await db.container_transactions.find({}, {"_id": 0}).sort("issued_at", -1).to_list(2000)


# ------------------------------------------------------------------ cleaning
@api_router.get("/cleaning/pending")
async def cleaning_pending(user: dict = Depends(require_roles("admin", "staff"))):
    return await db.containers.find({"status": "Washing"}, {"_id": 0}).sort("container_code", 1).to_list(1000)


@api_router.post("/cleaning/{cid}/complete")
async def cleaning_complete(cid: str, user: dict = Depends(require_roles("admin", "staff"))):
    container = await db.containers.find_one({"id": cid})
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
    if container["status"] != "Washing":
        raise HTTPException(status_code=400, detail="Container is not in washing queue")
    ts = now_iso()
    await db.containers.update_one({"id": cid}, {"$set": {"status": "Ready", "last_cleaned_at": ts}})
    await db.cleaning_records.insert_one({
        "id": str(uuid.uuid4()), "container_id": cid, "container_code": container["container_code"],
        "cleaned_by": user["name"], "cleaned_at": ts, "sanitization_status": "Sanitized", "notes": "",
    })
    return {"message": "Container cleaned and ready", "container_id": cid}


@api_router.post("/containers/{cid}/mark-available")
async def mark_available(cid: str, user: dict = Depends(require_roles("admin", "staff"))):
    await db.containers.update_one({"id": cid, "status": "Ready"}, {"$set": {"status": "Available"}})
    return {"message": "Container available"}


# ------------------------------------------------------------------ analytics
@api_router.get("/analytics/dashboard")
async def analytics_dashboard(user: dict = Depends(require_roles("admin", "staff"))):
    settings = await get_settings()
    total_containers = await db.containers.count_documents({})
    issued = await db.containers.count_documents({"status": "Issued"})
    washing = await db.containers.count_documents({"status": "Washing"})
    ready = await db.containers.count_documents({"status": "Available"}) + await db.containers.count_documents({"status": "Ready"})
    total_students = await db.users.count_documents({"role": "student"})
    total_returns = await db.container_transactions.count_documents({"status": {"$in": ["Returned", "Refunded"]}})
    total_issues = await db.container_transactions.count_documents({})
    return_rate = round((total_returns / total_issues) * 100, 1) if total_issues else 0.0

    disposables_avoided = total_returns
    waste_kg = round((total_returns * WASTE_PER_CONTAINER_G) / 1000, 2)
    co2_kg = round((total_returns * CO2_PER_CONTAINER_G) / 1000, 2)
    cost_saved = round(total_returns * settings["disposable_cost"], 2)

    # status distribution
    statuses = ["Available", "Issued", "Returned", "Washing", "Ready", "Lost", "Damaged"]
    status_dist = []
    for s in statuses:
        c = await db.containers.count_documents({"status": s})
        if c:
            status_dist.append({"name": s, "value": c})

    # last 7 days activity
    txns = await db.container_transactions.find({}, {"_id": 0}).to_list(5000)
    from collections import defaultdict
    daily = defaultdict(lambda: {"issued": 0, "returned": 0})
    for t in txns:
        if t.get("issued_at"):
            d = t["issued_at"][:10]
            daily[d]["issued"] += 1
        if t.get("returned_at"):
            d = t["returned_at"][:10]
            daily[d]["returned"] += 1
    daily_activity = [{"date": k[5:], "issued": v["issued"], "returned": v["returned"]} for k, v in sorted(daily.items())][-7:]

    # top reused containers
    top = await db.containers.find({}, {"_id": 0}).sort("usage_count", -1).limit(5).to_list(5)
    top_reused = [{"code": c["container_code"], "cycles": c["usage_count"]} for c in top]

    return {
        "total_containers": total_containers, "issued": issued, "washing": washing, "ready": ready,
        "total_students": total_students, "total_returns": total_returns, "return_rate": return_rate,
        "disposables_avoided": disposables_avoided, "waste_kg": waste_kg, "co2_kg": co2_kg,
        "cost_saved": cost_saved, "status_distribution": status_dist,
        "daily_activity": daily_activity, "top_reused": top_reused,
    }


# ------------------------------------------------------------------ kiosk status + settings
@api_router.get("/kiosk/status")
async def kiosk_status():
    return {"online": True, "rfid_reader": "MFRC522 (simulated)", "load_cell": "HX711 (simulated)",
            "mode": "simulation", "last_ping": now_iso()}


@api_router.get("/kiosk/available-returns")
async def kiosk_available_returns():
    """Issued containers available to simulate a return at the kiosk."""
    txns = await db.container_transactions.find({"status": "Issued"}, {"_id": 0}).to_list(200)
    out = []
    for t in txns:
        c = await db.containers.find_one({"id": t["container_id"]}, {"_id": 0})
        if c:
            out.append({"rfid_uid": c["rfid_uid"], "container_code": c["container_code"],
                        "empty_weight": c["empty_weight"], "student_name": t["student_name"],
                        "deposit_amount": t["deposit_amount"]})
    return out


@api_router.get("/settings")
async def read_settings(user: dict = Depends(require_roles("admin", "staff"))):
    return await get_settings()


@api_router.put("/settings")
async def update_settings(data: SettingsInput, user: dict = Depends(require_roles("admin"))):
    await db.settings.update_one({"id": "global"}, {"$set": data.model_dump()}, upsert=True)
    return await get_settings()


@api_router.get("/")
async def root():
    return {"message": "ReLoop API online", "loop": "REUSE -> RETURN -> REFUND -> CLEAN -> REUSE"}


# ------------------------------------------------------------------ seeding
async def seed():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.containers.create_index("rfid_uid", unique=True)

    await get_settings()

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@reloop.io")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@123")
    if not await db.users.find_one({"email": admin_email}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "name": "System Admin", "email": admin_email,
            "phone": "9000000000", "password_hash": hash_password(admin_password), "role": "admin",
            "student_code": "", "wallet_balance": 0.0, "created_at": now_iso(),
        })

    if not await db.users.find_one({"email": "staff@reloop.io"}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "name": "Canteen Staff", "email": "staff@reloop.io",
            "phone": "9000000001", "password_hash": hash_password("Staff@123"), "role": "staff",
            "student_code": "", "wallet_balance": 0.0, "created_at": now_iso(),
        })

    # skip full demo seed if students already present
    if await db.users.count_documents({"role": "student"}) > 0:
        return

    students_def = [
        ("Arjun Nair", "arjun@campus.edu", "CS21042", 100.0),
        ("Priya Sharma", "priya@campus.edu", "EC21118", 70.0),
        ("Rahul Verma", "rahul@campus.edu", "ME21205", 40.0),
        ("Sneha Iyer", "sneha@campus.edu", "CS21077", 130.0),
        ("Karan Mehta", "karan@campus.edu", "EE21033", 55.0),
    ]
    students = []
    for name, email, code, bal in students_def:
        s = {"id": str(uuid.uuid4()), "name": name, "email": email, "phone": "98" + code[-8:].rjust(8, "0"),
             "password_hash": hash_password("Student@123"), "role": "student",
             "student_code": code, "wallet_balance": bal, "created_at": now_iso()}
        students.append(s)
    await db.users.insert_many([dict(s) for s in students])

    containers_def = [
        ("GreenBowl-8942", "RFID-8942", "750ml", 245.0),
        ("CampusBento-1204", "RFID-1204", "1000ml", 310.0),
        ("EcoTiffin-5521", "RFID-5521", "500ml", 190.0),
        ("GreenBowl-8943", "RFID-8943", "750ml", 248.0),
        ("CampusBento-1205", "RFID-1205", "1000ml", 305.0),
        ("EcoTiffin-5522", "RFID-5522", "500ml", 188.0),
        ("GreenBowl-8944", "RFID-8944", "750ml", 246.0),
        ("EcoTiffin-5523", "RFID-5523", "500ml", 191.0),
        ("CampusBento-1206", "RFID-1206", "1000ml", 308.0),
        ("GreenBowl-8945", "RFID-8945", "750ml", 244.0),
        ("EcoTiffin-5524", "RFID-5524", "500ml", 189.0),
        ("CampusBento-1207", "RFID-1207", "1000ml", 312.0),
    ]
    containers = []
    for code, rfid, cap, wt in containers_def:
        containers.append({
            "id": str(uuid.uuid4()), "container_code": code, "rfid_uid": rfid, "capacity": cap,
            "material": "Food-grade PP", "empty_weight": wt, "condition": "good",
            "status": "Available", "usage_count": 0, "last_cleaned_at": now_iso(),
            "current_holder": None, "current_holder_name": None, "created_at": now_iso(),
        })
    await db.containers.insert_many([dict(c) for c in containers])

    settings = await get_settings()
    deposit = settings["deposit_amount"]
    base = datetime.now(timezone.utc)

    # create historical returned transactions to give analytics some life
    async def make_returned(student, container, days_ago):
        issued_at = (base - timedelta(days=days_ago, hours=2)).isoformat()
        returned_at = (base - timedelta(days=days_ago)).isoformat()
        txn_id = str(uuid.uuid4())
        await db.container_transactions.insert_one({
            "id": txn_id, "student_id": student["id"], "student_name": student["name"],
            "container_id": container["id"], "container_code": container["container_code"],
            "rfid_uid": container["rfid_uid"], "deposit_amount": deposit, "refund_amount": deposit,
            "issued_at": issued_at, "returned_at": returned_at, "status": "Refunded", "issued_by": "Canteen Staff",
        })
        await db.wallet_transactions.insert_one({
            "id": str(uuid.uuid4()), "student_id": student["id"], "transaction_type": "Deposit",
            "amount": -deposit, "reference": txn_id, "balance_after": 0.0,
            "description": f"Deposit held for container {container['container_code']}", "created_at": issued_at})
        await db.wallet_transactions.insert_one({
            "id": str(uuid.uuid4()), "student_id": student["id"], "transaction_type": "Refund",
            "amount": deposit, "reference": txn_id, "balance_after": 0.0,
            "description": f"Refund for returned container {container['container_code']}", "created_at": returned_at})
        await db.containers.update_one({"id": container["id"]}, {"$inc": {"usage_count": 1}})

    history = [
        (0, 0, 6), (1, 1, 5), (2, 2, 5), (0, 3, 4), (3, 4, 4), (1, 5, 3),
        (4, 6, 3), (2, 7, 2), (0, 8, 2), (3, 9, 1), (1, 10, 1), (0, 0, 7),
        (2, 1, 6), (4, 2, 4), (3, 3, 2),
    ]
    for si, ci, days in history:
        await make_returned(students[si], containers[ci], days)

    # a few currently issued containers
    for si, ci in [(0, 0), (1, 2), (3, 4)]:
        student, container = students[si], containers[ci]
        ts = (base - timedelta(hours=si + 1)).isoformat()
        txn_id = str(uuid.uuid4())
        await db.container_transactions.insert_one({
            "id": txn_id, "student_id": student["id"], "student_name": student["name"],
            "container_id": container["id"], "container_code": container["container_code"],
            "rfid_uid": container["rfid_uid"], "deposit_amount": deposit, "refund_amount": None,
            "issued_at": ts, "returned_at": None, "status": "Issued", "issued_by": "Canteen Staff"})
        await db.containers.update_one({"id": container["id"]}, {"$set": {
            "status": "Issued", "current_holder": student["id"], "current_holder_name": student["name"]}})
        await db.wallet_transactions.insert_one({
            "id": str(uuid.uuid4()), "student_id": student["id"], "transaction_type": "Deposit",
            "amount": -deposit, "reference": txn_id, "balance_after": student["wallet_balance"],
            "description": f"Deposit held for container {container['container_code']}", "created_at": ts})

    # put a couple into washing queue
    for ci in [1, 5]:
        await db.containers.update_one({"id": containers[ci]["id"]}, {"$set": {"status": "Washing"}})

    logger.info("ReLoop demo data seeded.")


@app.on_event("startup")
async def on_startup():
    await seed()


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
