from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from services.auth_service import verify_token, get_user_from_firestore
from services.firebase_service import db
from services.risk_calculator import calculate_risk_score
from services.team_service import get_manager_team_uids

router = APIRouter(prefix="/api/manager", tags=["manager"])

DEFAULT_MODULE_TOTAL = 8

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

def _require_manager(user: dict):
    if user.get("role") != "manager":
        raise HTTPException(status_code=403, detail={"error": "AUTH_INSUFFICIENT_ROLE"})

def _verify_team_member(manager: dict, employee_uid: str):
    tenant_id = manager.get("tenant_id", "group-sns")
    if employee_uid not in get_manager_team_uids(manager["uid"], tenant_id):
        raise HTTPException(status_code=403, detail={"error": "EMPLOYEE_NOT_IN_TEAM"})

def _get_progress(uid: str) -> dict:
    progress_doc = db.collection("employee_progress").document(uid).get()
    return progress_doc.to_dict() if progress_doc.exists else {}

def _get_modules(tenant_id: str) -> list:
    modules = [
        doc.to_dict()
        for doc in db.collection("modules").where("tenant_id", "==", tenant_id).stream()
    ]
    modules.sort(key=lambda module: module.get("order", 0))
    return modules

def _percentage(completed: int, total: int) -> int:
    if total <= 0:
        return 0
    return int((completed / total) * 100)

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

class ReminderRequest(BaseModel):
    employee_uid: str
    message: str | None = None

class ResetQuizRequest(BaseModel):
    employee_uid: str
    module_id: str

class DeadlineRequest(BaseModel):
    deadline: str

@router.post("/set-team-deadline")
def set_team_deadline(request: DeadlineRequest, authorization: str = Header(...)):
    manager = get_current_user(authorization)
    _require_manager(manager)

    tenant_id = manager.get("tenant_id", "group-sns")
    now = datetime.now(timezone.utc)
    team_uids = get_manager_team_uids(manager["uid"], tenant_id)

    db.collection("users").document(manager["uid"]).update({
        "team_deadline": request.deadline
    })

    deadline_text = request.deadline
    try:
        deadline_text = datetime.fromisoformat(request.deadline.replace("Z", "+00:00")).strftime("%b %d, %Y")
    except Exception:
        pass

    for employee_uid in team_uids:
        db.collection("notifications").document().set({
            "uid": employee_uid,
            "tenant_id": tenant_id,
            "type": "deadline",
            "message": f"Your manager set a training deadline for {deadline_text}.",
            "from_uid": manager["uid"],
            "read": False,
            "created_at": now
        })

    db.collection("activity_log").add({
        "tenant_id": tenant_id,
        "uid": manager["uid"],
        "action": "team_deadline_set",
        "module_id": None,
        "metadata": {
            "deadline": request.deadline,
            "notified_count": len(team_uids)
        },
        "timestamp": now
    })

    return {
        "success": True,
        "data": {
            "deadline": request.deadline,
            "notified_count": len(team_uids)
        }
    }

@router.get("/team-deadline")
def get_team_deadline(authorization: str = Header(...)):
    manager = get_current_user(authorization)
    _require_manager(manager)

    manager_doc = db.collection("users").document(manager["uid"]).get()
    manager_data = manager_doc.to_dict() if manager_doc.exists else manager
    deadline = manager_data.get("team_deadline")

    return {
        "success": True,
        "data": _deadline_status(deadline)
    }

@router.post("/remind-employee")
def remind_employee(request: ReminderRequest, authorization: str = Header(...)):
    manager = get_current_user(authorization)
    _require_manager(manager)
    _verify_team_member(manager, request.employee_uid)

    now = datetime.now(timezone.utc)
    message = request.message or "Your manager has reminded you to complete your training"
    db.collection("notifications").document().set({
        "uid": request.employee_uid,
        "tenant_id": manager.get("tenant_id", "group-sns"),
        "type": "reminder",
        "message": message,
        "from_uid": manager["uid"],
        "read": False,
        "created_at": now
    })

    db.collection("activity_log").add({
        "tenant_id": manager.get("tenant_id", "group-sns"),
        "uid": manager["uid"],
        "action": "reminder_sent",
        "module_id": None,
        "metadata": {"employee_uid": request.employee_uid},
        "timestamp": now
    })

    return {
        "success": True,
        "data": {
            "notified": True
        }
    }

@router.post("/reset-quiz")
def reset_quiz(request: ResetQuizRequest, authorization: str = Header(...)):
    manager = get_current_user(authorization)
    _require_manager(manager)
    _verify_team_member(manager, request.employee_uid)

    progress_ref = db.collection("employee_progress").document(request.employee_uid)
    progress_doc = progress_ref.get()
    if not progress_doc.exists:
        raise HTTPException(status_code=404, detail={"error": "PROGRESS_NOT_FOUND"})

    progress = progress_doc.to_dict()
    modules_completed = [
        module_id for module_id in progress.get("modules_completed", [])
        if module_id != request.module_id
    ]
    badges_earned = [
        badge for badge in progress.get("badges_earned", [])
        if badge.get("module_id") != request.module_id
    ]
    now = datetime.now(timezone.utc)

    progress_ref.update({
        "modules_completed": modules_completed,
        "badges_earned": badges_earned,
        "certificate_issued": False,
        "certificate_id": None,
        "certificate_issued_at": None,
        "updated_at": now
    })

    db.collection("activity_log").add({
        "tenant_id": manager.get("tenant_id", "group-sns"),
        "uid": request.employee_uid,
        "action": "quiz_reset_by_manager",
        "module_id": request.module_id,
        "metadata": {
            "module_id": request.module_id,
            "reset_by": manager["uid"]
        },
        "timestamp": now
    })

    return {
        "success": True,
        "data": {
            "reset": True
        }
    }

@router.get("/employee-detail/{employee_uid}")
def get_employee_detail(employee_uid: str, authorization: str = Header(...)):
    manager = get_current_user(authorization)
    _require_manager(manager)
    _verify_team_member(manager, employee_uid)

    tenant_id = manager.get("tenant_id", "group-sns")
    employee_doc = db.collection("users").document(employee_uid).get()
    if not employee_doc.exists:
        raise HTTPException(status_code=404, detail={"error": "USER_NOT_FOUND"})

    employee = employee_doc.to_dict()
    progress = _get_progress(employee_uid)
    modules = _get_modules(tenant_id)
    modules_total = len(modules) or DEFAULT_MODULE_TOTAL
    module_titles = {module.get("id"): module.get("title", "") for module in modules}
    modules_completed = len(progress.get("modules_completed", []))
    attempts = [
        doc.to_dict()
        for doc in db.collection("quiz_attempts").where("uid", "==", employee_uid).stream()
    ]

    history_by_module = {}
    for attempt in attempts:
        module_id = attempt.get("module_id")
        if not module_id:
            continue
        item = history_by_module.setdefault(module_id, {
            "module_id": module_id,
            "module_title": module_titles.get(module_id, module_id),
            "attempts": 0,
            "best_score": None,
            "passed": False,
            "last_attempt_at": None
        })
        item["attempts"] += 1
        score = attempt.get("score")
        if score is not None:
            item["best_score"] = score if item["best_score"] is None else max(item["best_score"], score)
        item["passed"] = item["passed"] or attempt.get("passed") is True
        attempt_time = attempt.get("submitted_at") or attempt.get("started_at")
        if attempt_time and (item["last_attempt_at"] is None or attempt_time > item["last_attempt_at"]):
            item["last_attempt_at"] = attempt_time

    quiz_history = []
    for item in history_by_module.values():
        item["last_attempt_at"] = _to_iso(item["last_attempt_at"])
        quiz_history.append(item)

    last_active = (
        progress.get("updated_at")
        or progress.get("last_module_completed_at")
        or employee.get("last_login_at")
    )

    return {
        "success": True,
        "data": {
            "uid": employee_uid,
            "name": employee.get("name", ""),
            "email": employee.get("email", ""),
            "modules_completed": modules_completed,
            "modules_total": modules_total,
            "completion_percentage": _percentage(modules_completed, modules_total),
            "risk_score": calculate_risk_score(employee_uid, tenant_id),
            "badges_earned": len(progress.get("badges_earned", [])),
            "certificate_earned": progress.get("certificate_issued", False),
            "quiz_history": quiz_history,
            "last_active": _to_iso(last_active)
        }
    }

@router.get("/team-risk")
def get_team_risk(authorization: str = Header(...)):
    manager = get_current_user(authorization)
    _require_manager(manager)

    tenant_id = manager.get("tenant_id", "group-sns")
    high_risk = 0
    medium_risk = 0
    low_risk = 0
    team_members = []

    for employee_uid in get_manager_team_uids(manager["uid"], tenant_id):
        employee_doc = db.collection("users").document(employee_uid).get()
        if not employee_doc.exists:
            continue
        employee = employee_doc.to_dict()
        risk = calculate_risk_score(employee_uid, tenant_id)
        if risk["level"] == "High":
            high_risk += 1
        elif risk["level"] == "Medium":
            medium_risk += 1
        else:
            low_risk += 1
        team_members.append({
            "uid": employee_uid,
            "name": employee.get("name", ""),
            "risk_score": risk["score"],
            "risk_level": risk["level"],
            "reasons": risk["reasons"]
        })

    return {
        "success": True,
        "data": {
            "high_risk": high_risk,
            "medium_risk": medium_risk,
            "low_risk": low_risk,
            "team_members": team_members
        }
    }
