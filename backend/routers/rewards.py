from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Header
from services.auth_service import verify_token, get_user_from_firestore
from services.firebase_service import db
from services.badge_service import get_all_badges_for_employee
from services.fraud_detector import check_fraud
from services.completion_checker import get_completion_time_minutes

router = APIRouter(prefix="/api/rewards", tags=["rewards"])

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

def _get_existing_certificate(certificate_id: str):
    certificate_doc = db.collection("certificates").document(certificate_id).get()
    if not certificate_doc.exists:
        return None
    certificate = certificate_doc.to_dict()
    return {
        "certificate_id": certificate.get("certificate_id"),
        "employee_name": certificate.get("employee_name"),
        "issued_at": _to_iso(certificate.get("issued_at")),
        "modules_completed": certificate.get("modules_completed"),
        "tenant_name": certificate.get("tenant_name"),
        "fraud_flagged": certificate.get("fraud_flagged", False)
    }

@router.get("/badges")
def get_badges(authorization: str = Header(...)):
    user = get_current_user(authorization)
    if user.get("role") != "employee":
        raise HTTPException(status_code=403, detail={"error": "AUTH_INSUFFICIENT_ROLE"})

    badges = get_all_badges_for_employee(user["uid"], user["tenant_id"])
    return {
        "success": True,
        "data": {
            "badges": badges
        }
    }

@router.get("/certificate/check")
def check_certificate(authorization: str = Header(...)):
    user = get_current_user(authorization)
    if user.get("role") != "employee":
        raise HTTPException(status_code=403, detail={"error": "AUTH_INSUFFICIENT_ROLE"})

    progress_doc = db.collection("employee_progress").document(user["uid"]).get()
    progress = progress_doc.to_dict() if progress_doc.exists else {}
    eligible = len(progress.get("modules_completed", [])) == 8

    return {
        "success": True,
        "data": {
            "eligible": eligible,
            "all_modules_passed": eligible,
            "fraud_flagged": progress.get("fraud_flagged", False),
            "completion_time_minutes": get_completion_time_minutes(user["uid"])
        }
    }

@router.post("/certificate/generate")
def generate_certificate(authorization: str = Header(...)):
    user = get_current_user(authorization)
    if user.get("role") != "employee":
        raise HTTPException(status_code=403, detail={"error": "AUTH_INSUFFICIENT_ROLE"})

    uid = user["uid"]
    tenant_id = user["tenant_id"]
    progress_ref = db.collection("employee_progress").document(uid)
    progress_doc = progress_ref.get()
    if not progress_doc.exists:
        raise HTTPException(status_code=404, detail={"error": "PROGRESS_NOT_FOUND"})

    progress = progress_doc.to_dict()
    if len(progress.get("modules_completed", [])) != 8:
        raise HTTPException(status_code=403, detail={"error": "CERTIFICATE_NOT_ELIGIBLE"})

    if progress.get("certificate_issued") and progress.get("certificate_id"):
        existing_certificate = _get_existing_certificate(progress["certificate_id"])
        if existing_certificate:
            return {
                "success": True,
                "data": existing_certificate
            }

    fraud_flagged = check_fraud(uid, tenant_id)
    if fraud_flagged:
        progress_ref.update({
            "fraud_flagged": True
        })

    completion_time_minutes = get_completion_time_minutes(uid)
    now = datetime.now(timezone.utc)
    timestamp = int(now.timestamp())
    certificate_id = f"cert_{uid}_{timestamp}"

    tenant_doc = db.collection("tenants").document(tenant_id).get()
    tenant_data = tenant_doc.to_dict() if tenant_doc.exists else {}
    tenant_name = tenant_data.get("name", tenant_id)
    settings = tenant_data.get("settings", {})
    validity_days = settings.get("certificate_validity_days", 365)
    valid_until = now + timedelta(days=validity_days)

    user_doc = db.collection("users").document(uid).get()
    user_data = user_doc.to_dict() if user_doc.exists else user
    employee_name = user_data.get("name", "")
    employee_email = user_data.get("email", "")

    certificate_data = {
        "certificate_id": certificate_id,
        "uid": uid,
        "tenant_id": tenant_id,
        "employee_name": employee_name,
        "employee_email": employee_email,
        "tenant_name": tenant_name,
        "issued_at": now,
        "valid_until": valid_until,
        "modules_completed": 8,
        "fraud_flagged": fraud_flagged,
        "total_completion_minutes": completion_time_minutes
    }

    db.collection("certificates").document(certificate_id).set(certificate_data)

    progress_ref.update({
        "certificate_issued": True,
        "certificate_id": certificate_id,
        "certificate_issued_at": now,
        "fraud_flagged": fraud_flagged,
        "total_completion_minutes": completion_time_minutes,
        "updated_at": now
    })

    db.collection("activity_log").add({
        "tenant_id": tenant_id,
        "uid": uid,
        "action": "certificate_generated",
        "module_id": None,
        "metadata": {"certificate_id": certificate_id},
        "timestamp": now
    })

    if fraud_flagged:
        db.collection("activity_log").add({
            "tenant_id": tenant_id,
            "uid": uid,
            "action": "fraud_flag_raised",
            "module_id": None,
            "metadata": {
                "certificate_id": certificate_id,
                "total_completion_minutes": completion_time_minutes
            },
            "timestamp": now
        })

    return {
        "success": True,
        "data": {
            "certificate_id": certificate_id,
            "employee_name": employee_name,
            "issued_at": _to_iso(now),
            "modules_completed": 8,
            "tenant_name": tenant_name,
            "fraud_flagged": fraud_flagged
        }
    }
