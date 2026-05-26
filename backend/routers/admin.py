import csv
import io
import secrets
import string
from datetime import datetime, timezone
from fastapi import APIRouter, File, HTTPException, Header, UploadFile
from pydantic import BaseModel
from firebase_admin import auth as firebase_auth
from models.user import UpdateUserRequest
from services.auth_service import verify_token, get_user_from_firestore
from services.firebase_service import db
from services.team_service import assign_employee_to_manager, clear_employee_manager

router = APIRouter(prefix="/api/admin", tags=["admin"])

def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail={"error": "AUTH_TOKEN_MISSING"})
    token = authorization.replace("Bearer ", "")
    decoded = verify_token(token)
    uid = decoded.get("uid")
    return get_user_from_firestore(uid)

def _to_iso(value):
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)

def _require_admin(user: dict):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail={"error": "AUTH_INSUFFICIENT_ROLE"})

def _get_progress(uid: str) -> dict:
    progress_doc = db.collection("employee_progress").document(uid).get()
    return progress_doc.to_dict() if progress_doc.exists else {}

def _get_certificate(progress: dict) -> dict:
    certificate_id = progress.get("certificate_id")
    if not certificate_id:
        return {}
    certificate_doc = db.collection("certificates").document(certificate_id).get()
    return certificate_doc.to_dict() if certificate_doc.exists else {}

def _generate_password(length=10):
    characters = string.ascii_letters + string.digits
    return "".join(secrets.choice(characters) for _ in range(length))

def _create_progress_doc(uid: str, tenant_id: str, now):
    db.collection("employee_progress").document(uid).set({
        "uid": uid,
        "tenant_id": tenant_id,
        "modules_completed": [],
        "modules_unlocked": ["module_01_phishing"],
        "badges_earned": [],
        "certificate_issued": False,
        "certificate_id": None,
        "certificate_issued_at": None,
        "fraud_flagged": False,
        "first_module_started_at": None,
        "last_module_completed_at": None,
        "total_completion_minutes": None,
        "created_at": now,
        "updated_at": now
    })

def _find_user_by_email(email: str, tenant_id: str):
    matches = db.collection("users").where("tenant_id", "==", tenant_id).stream()
    for doc in matches:
        user = doc.to_dict()
        if user.get("email") == email:
            return user
    return None

def _assign_manager(employee_uid: str, manager_uid: str):
    assign_employee_to_manager(employee_uid, manager_uid)

class AssignManagerRequest(BaseModel):
    employee_uid: str
    manager_uid: str

class DeadlineRequest(BaseModel):
    deadline: str

def _deadline_status(deadline):
    if not deadline:
        return {
            "deadline": None,
            "days_remaining": None,
            "is_overdue": False
        }

    deadline_dt = datetime.fromisoformat(str(deadline).replace("Z", "+00:00"))
    now = datetime.now(timezone.utc)
    if deadline_dt.tzinfo is None:
        deadline_dt = deadline_dt.replace(tzinfo=timezone.utc)
    days_remaining = (deadline_dt.date() - now.date()).days

    return {
        "deadline": deadline_dt.isoformat(),
        "days_remaining": days_remaining,
        "is_overdue": days_remaining < 0
    }

@router.get("/users")
def get_users(authorization: str = Header(...)):
    admin = get_current_user(authorization)
    _require_admin(admin)

    tenant_id = admin.get("tenant_id", "group-sns")
    user_docs = db.collection("users").where("tenant_id", "==", tenant_id).stream()
    users = []

    for doc in user_docs:
        user = doc.to_dict()
        uid = user.get("uid")
        progress = _get_progress(uid) if uid else {}
        users.append({
            "uid": uid,
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "role": user.get("role", ""),
            "active": user.get("active", False),
            "manager_uid": user.get("manager_uid"),
            "modules_completed": len(progress.get("modules_completed", [])),
            "certificate_earned": progress.get("certificate_issued", False),
            "created_at": _to_iso(user.get("created_at"))
        })

    return {
        "success": True,
        "data": {
            "users": users
        }
    }

@router.get("/compliance-report")
def get_compliance_report(authorization: str = Header(...)):
    admin = get_current_user(authorization)
    _require_admin(admin)

    tenant_id = admin.get("tenant_id", "group-sns")
    employee_docs = db.collection("users").where("tenant_id", "==", tenant_id).stream()
    report = []

    for doc in employee_docs:
        employee = doc.to_dict()
        if employee.get("role") != "employee":
            continue
        uid = employee.get("uid")
        progress = _get_progress(uid) if uid else {}
        certificate = _get_certificate(progress)
        certificate_earned = progress.get("certificate_issued", False)
        certificate_issued_at = (
            certificate.get("issued_at")
            or progress.get("certificate_issued_at")
        )

        report.append({
            "name": employee.get("name", ""),
            "email": employee.get("email", ""),
            "role": employee.get("role", ""),
            "modules_completed": len(progress.get("modules_completed", [])),
            "certificate_earned": certificate_earned,
            "certificate_issued_at": _to_iso(certificate_issued_at),
            "fraud_flagged": progress.get("fraud_flagged", False),
            "completion_time_minutes": (
                certificate.get("total_completion_minutes")
                if certificate
                else progress.get("total_completion_minutes")
            )
        })

    return {
        "success": True,
        "data": {
            "generated_at": _to_iso(datetime.now(timezone.utc)),
            "report": report
        }
    }

@router.post("/assign-manager")
def assign_manager(request: AssignManagerRequest, authorization: str = Header(...)):
    admin = get_current_user(authorization)
    _require_admin(admin)

    employee_ref = db.collection("users").document(request.employee_uid)
    employee_doc = employee_ref.get()
    if not employee_doc.exists:
        raise HTTPException(status_code=404, detail={"error": "USER_NOT_FOUND"})

    manager_ref = db.collection("users").document(request.manager_uid)
    manager_doc = manager_ref.get()
    if not manager_doc.exists:
        raise HTTPException(status_code=404, detail={"error": "MANAGER_NOT_FOUND"})

    manager = manager_doc.to_dict()
    if manager.get("role") != "manager":
        raise HTTPException(status_code=400, detail={"error": "INVALID_MANAGER"})

    assign_employee_to_manager(request.employee_uid, request.manager_uid)

    return {
        "success": True,
        "data": {
            "assigned": True
        }
    }

@router.post("/update-user")
def update_user(request: UpdateUserRequest, authorization: str = Header(...)):
    admin = get_current_user(authorization)
    _require_admin(admin)

    user_ref = db.collection("users").document(request.uid)
    user_doc = user_ref.get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail={"error": "USER_NOT_FOUND"})

    existing_user = user_doc.to_dict()
    updates = {}
    firebase_updates = {}

    if request.name is not None:
        updates["name"] = request.name
        firebase_updates["display_name"] = request.name
    if request.email is not None:
        updates["email"] = request.email
        firebase_updates["email"] = request.email
    if request.role is not None:
        updates["role"] = request.role
        if request.role == "manager":
            clear_employee_manager(request.uid)
            updates["manager_uid"] = None
            updates.setdefault("team_uids", existing_user.get("team_uids", []))
    if request.active is not None:
        updates["active"] = request.active
        firebase_updates["disabled"] = not request.active

    if firebase_updates:
        try:
            firebase_auth.update_user(request.uid, **firebase_updates)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail={"error": "FIREBASE_UPDATE_FAILED", "message": str(e)}
            )

    if updates:
        user_ref.update(updates)

    target_role = request.role or existing_user.get("role")
    if target_role == "employee" and request.manager_uid:
        manager_doc = db.collection("users").document(request.manager_uid).get()
        if not manager_doc.exists:
            raise HTTPException(status_code=404, detail={"error": "MANAGER_NOT_FOUND"})
        manager = manager_doc.to_dict()
        if manager.get("role") != "manager":
            raise HTTPException(status_code=400, detail={"error": "INVALID_MANAGER"})
        assign_employee_to_manager(request.uid, request.manager_uid)
    elif target_role == "employee" and request.manager_uid == "":
        clear_employee_manager(request.uid)

    updated_doc = user_ref.get()
    updated_user = updated_doc.to_dict()
    return {
        "success": True,
        "data": {
            "uid": updated_user.get("uid"),
            "name": updated_user.get("name", ""),
            "email": updated_user.get("email", ""),
            "role": updated_user.get("role", ""),
            "active": updated_user.get("active", False),
            "manager_uid": updated_user.get("manager_uid"),
            "team_uids": updated_user.get("team_uids", [])
        }
    }

@router.post("/set-deadline")
def set_training_deadline(request: DeadlineRequest, authorization: str = Header(...)):
    admin = get_current_user(authorization)
    _require_admin(admin)

    tenant_id = admin.get("tenant_id", "group-sns")
    tenant_ref = db.collection("tenants").document(tenant_id)
    tenant_doc = tenant_ref.get()
    tenant = tenant_doc.to_dict() if tenant_doc.exists else {}
    settings = tenant.get("settings", {})
    settings["training_deadline"] = request.deadline
    tenant_ref.update({
        "settings": settings
    })

    return {
        "success": True,
        "data": {
            "deadline": request.deadline
        }
    }

@router.get("/deadline")
def get_training_deadline(authorization: str = Header(...)):
    user = get_current_user(authorization)
    tenant_id = user.get("tenant_id", "group-sns")
    tenant_doc = db.collection("tenants").document(tenant_id).get()
    tenant = tenant_doc.to_dict() if tenant_doc.exists else {}
    deadline = tenant.get("settings", {}).get("training_deadline")

    return {
        "success": True,
        "data": _deadline_status(deadline)
    }

@router.post("/bulk-import")
async def bulk_import_users(file: UploadFile = File(...), authorization: str = Header(...)):
    admin = get_current_user(authorization)
    _require_admin(admin)

    tenant_id = admin.get("tenant_id", "group-sns")
    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8-sig")))
    results = []
    imported = 0
    failed = 0

    for row in reader:
        email = (row.get("email") or "").strip()
        name = (row.get("name") or "").strip()
        role = (row.get("role") or "employee").strip()
        manager_email = (row.get("manager_email") or "").strip()
        temporary_password = None

        try:
            if not email or not name:
                raise ValueError("name and email are required")

            temporary_password = _generate_password()
            user_record = firebase_auth.create_user(
                email=email,
                password=temporary_password,
                display_name=name
            )
            uid = user_record.uid
            now = datetime.now(timezone.utc)
            manager_uid = None

            if manager_email:
                manager = _find_user_by_email(manager_email, tenant_id)
                if manager and manager.get("role") == "manager":
                    manager_uid = manager.get("uid")

            db.collection("users").document(uid).set({
                "uid": uid,
                "tenant_id": tenant_id,
                "email": email,
                "name": name,
                "role": role,
                "active": True,
                "manager_uid": manager_uid,
                "team_uids": [],
                "created_at": now,
                "created_by_uid": admin.get("uid"),
                "last_login_at": None
            })
            _create_progress_doc(uid, tenant_id, now)

            if manager_uid:
                _assign_manager(uid, manager_uid)

            imported += 1
            results.append({
                "email": email,
                "status": "success",
                "temporary_password": temporary_password,
                "error": None
            })
        except Exception as exc:
            failed += 1
            results.append({
                "email": email,
                "status": "failed",
                "temporary_password": None,
                "error": str(exc)
            })

    return {
        "success": True,
        "data": {
            "imported": imported,
            "failed": failed,
            "results": results
        }
    }
