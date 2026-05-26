from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Header
from services.auth_service import verify_token, get_user_from_firestore
from services.firebase_service import db
from services.achievement_service import check_achievements
from services.risk_calculator import calculate_risk_score
from services.team_service import get_manager_team_uids

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

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

def _percentage(completed: int, total: int) -> int:
    if total <= 0:
        return 0
    return int((completed / total) * 100)

def _sort_timestamp(value) -> float:
    if value is None:
        return 0
    if hasattr(value, "timestamp"):
        return value.timestamp()
    return 0

def _get_modules(tenant_id: str) -> list:
    modules = [
        doc.to_dict()
        for doc in db.collection("modules").where("tenant_id", "==", tenant_id).stream()
    ]
    modules.sort(key=lambda module: module.get("order", 0))
    return modules

def _get_progress(uid: str) -> dict:
    progress_doc = db.collection("employee_progress").document(uid).get()
    return progress_doc.to_dict() if progress_doc.exists else {}

def _get_recent_activity(uid: str, limit: int = 5) -> list:
    activity_docs = db.collection("activity_log").where("uid", "==", uid).stream()
    activities = [doc.to_dict() for doc in activity_docs]
    activities.sort(key=lambda item: _sort_timestamp(item.get("timestamp")), reverse=True)
    return [
        {
            "module_id": activity.get("module_id"),
            "action": activity.get("action", ""),
            "timestamp": _to_iso(activity.get("timestamp"))
        }
        for activity in activities[:limit]
    ]

def _require_role(user: dict, role: str):
    if user.get("role") != role:
        raise HTTPException(status_code=403, detail={"error": "AUTH_INSUFFICIENT_ROLE"})

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

def _tenant_deadline(tenant_id: str) -> dict:
    tenant_doc = db.collection("tenants").document(tenant_id).get()
    tenant = tenant_doc.to_dict() if tenant_doc.exists else {}
    return _deadline_status(tenant.get("settings", {}).get("training_deadline"))

def _team_deadline(manager_uid: str) -> dict:
    manager_doc = db.collection("users").document(manager_uid).get()
    manager = manager_doc.to_dict() if manager_doc.exists else {}
    return _deadline_status(manager.get("team_deadline"))

def _employee_deadline(user: dict, tenant_id: str) -> dict:
    manager_uid = user.get("manager_uid")
    if manager_uid:
        manager_doc = db.collection("users").document(manager_uid).get()
        manager = manager_doc.to_dict() if manager_doc.exists else {}
        team_deadline = manager.get("team_deadline")
        if team_deadline:
            return _deadline_status(team_deadline)
    return _tenant_deadline(tenant_id)

def _unread_notifications_count(uid: str) -> int:
    notifications = db.collection("notifications").where("uid", "==", uid).stream()
    return sum(1 for doc in notifications if not doc.to_dict().get("read", False))

def _recent_reminders_count(uid: str, tenant_id: str) -> int:
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    logs = db.collection("activity_log").where("uid", "==", uid).stream()
    count = 0
    for doc in logs:
        log = doc.to_dict()
        timestamp = log.get("timestamp")
        if timestamp and timestamp.tzinfo is None:
            timestamp = timestamp.replace(tzinfo=timezone.utc)
        if (
            log.get("tenant_id") == tenant_id
            and log.get("action") == "reminder_sent"
            and timestamp
            and timestamp >= cutoff
        ):
            count += 1
    return count

def _risk_distribution(uids: list, tenant_id: str) -> dict:
    distribution = {
        "high_risk_count": 0,
        "medium_risk_count": 0,
        "low_risk_count": 0
    }
    for uid in uids:
        risk = calculate_risk_score(uid, tenant_id)
        if risk["level"] == "High":
            distribution["high_risk_count"] += 1
        elif risk["level"] == "Medium":
            distribution["medium_risk_count"] += 1
        else:
            distribution["low_risk_count"] += 1
    return distribution

@router.get("/employee")
def get_employee_dashboard(authorization: str = Header(...)):
    user = get_current_user(authorization)
    _require_role(user, "employee")

    tenant_id = user.get("tenant_id", "group-sns")
    modules_total = len(_get_modules(tenant_id)) or 8
    progress = _get_progress(user["uid"])
    modules_completed = len(progress.get("modules_completed", []))
    risk_score = calculate_risk_score(user["uid"], tenant_id)

    return {
        "success": True,
        "data": {
            "employee_name": user.get("name", ""),
            "modules_completed": modules_completed,
            "modules_total": modules_total,
            "completion_percentage": _percentage(modules_completed, modules_total),
            "badges_earned": len(progress.get("badges_earned", [])),
            "certificate_eligible": modules_completed >= modules_total,
            "certificate_issued": progress.get("certificate_issued", False),
            "recent_activity": _get_recent_activity(user["uid"]),
            "risk_score": risk_score,
            "achievements": check_achievements(user["uid"], tenant_id),
            "notifications_count": _unread_notifications_count(user["uid"]),
            "deadline": _employee_deadline(user, tenant_id)
        }
    }

@router.get("/manager")
def get_manager_dashboard(authorization: str = Header(...)):
    manager = get_current_user(authorization)
    _require_role(manager, "manager")

    tenant_id = manager.get("tenant_id", "group-sns")
    modules_total = len(_get_modules(tenant_id)) or 8
    team_uids = get_manager_team_uids(manager["uid"], tenant_id)
    team_members = []
    fully_certified = 0
    in_progress = 0
    not_started = 0
    completion_percentages = []

    for uid in team_uids:
        user_doc = db.collection("users").document(uid).get()
        if not user_doc.exists:
            continue

        employee = user_doc.to_dict()
        progress = _get_progress(uid)
        completed_count = len(progress.get("modules_completed", []))
        completion_percentage = _percentage(completed_count, modules_total)
        completion_percentages.append(completion_percentage)

        certificate_earned = progress.get("certificate_issued", False)
        if certificate_earned:
            fully_certified += 1
        elif completed_count == 0:
            not_started += 1
        else:
            in_progress += 1

        last_active = (
            progress.get("updated_at")
            or progress.get("last_module_completed_at")
            or employee.get("last_login_at")
        )

        team_members.append({
            "uid": uid,
            "name": employee.get("name", ""),
            "email": employee.get("email", ""),
            "modules_completed": completed_count,
            "modules_total": modules_total,
            "completion_percentage": completion_percentage,
            "certificate_earned": certificate_earned,
            "last_active": _to_iso(last_active)
        })

    team_size = len(team_members)
    team_completion_percentage = int(sum(completion_percentages) / team_size) if team_size else 0
    team_risk = _risk_distribution([member["uid"] for member in team_members], tenant_id)

    return {
        "success": True,
        "data": {
            "manager_name": manager.get("name", ""),
            "team_size": team_size,
            "team_completion_percentage": team_completion_percentage,
            "fully_certified": fully_certified,
            "in_progress": in_progress,
            "not_started": not_started,
            "team_members": team_members,
            "team_risk_summary": {
                "high_risk": team_risk["high_risk_count"],
                "medium_risk": team_risk["medium_risk_count"],
                "low_risk": team_risk["low_risk_count"]
            },
            "team_deadline": _team_deadline(manager["uid"]),
            "pending_reminders": _recent_reminders_count(manager["uid"], tenant_id)
        }
    }

@router.get("/admin")
def get_admin_dashboard(authorization: str = Header(...)):
    admin = get_current_user(authorization)
    _require_role(admin, "admin")

    tenant_id = admin.get("tenant_id", "group-sns")
    modules = _get_modules(tenant_id)
    modules_total = len(modules) or 8
    employees = []
    user_docs = db.collection("users").where("tenant_id", "==", tenant_id).stream()
    for doc in user_docs:
        employee = doc.to_dict()
        if employee.get("role") == "employee":
            employees.append(employee)

    progress_by_uid = {
        employee.get("uid"): _get_progress(employee.get("uid"))
        for employee in employees
        if employee.get("uid")
    }

    total_employees = len(employees)
    total_certified = 0
    fraud_flags_count = 0
    completion_percentages = []
    recent_fraud_flags = []

    for employee in employees:
        uid = employee.get("uid")
        progress = progress_by_uid.get(uid, {})
        completed = len(progress.get("modules_completed", []))
        completion_percentages.append(_percentage(completed, modules_total))

        if progress.get("certificate_issued", False):
            total_certified += 1
        if progress.get("fraud_flagged", False):
            fraud_flags_count += 1
            recent_fraud_flags.append({
                "uid": uid,
                "name": employee.get("name", ""),
                "completion_time_minutes": progress.get("total_completion_minutes"),
                "flagged_at": _to_iso(progress.get("certificate_issued_at") or progress.get("updated_at"))
            })

    recent_fraud_flags.sort(
        key=lambda item: item.get("flagged_at") or "",
        reverse=True
    )

    overall_completion = int(sum(completion_percentages) / total_employees) if total_employees else 0
    employee_uids = [employee.get("uid") for employee in employees if employee.get("uid")]
    risk_distribution = _risk_distribution(employee_uids, tenant_id)

    module_completion_rates = []
    for module in modules:
        module_id = module.get("id")
        completed_count = sum(
            1 for progress in progress_by_uid.values()
            if module_id in progress.get("modules_completed", [])
        )
        module_completion_rates.append({
            "module_id": module_id,
            "module_title": module.get("title", ""),
            "completion_rate": _percentage(completed_count, total_employees)
        })

    return {
        "success": True,
        "data": {
            "total_employees": total_employees,
            "total_certified": total_certified,
            "overall_completion_percentage": overall_completion,
            "fraud_flags_count": fraud_flags_count,
            "module_completion_rates": module_completion_rates,
            "recent_fraud_flags": recent_fraud_flags,
            "risk_distribution": risk_distribution,
            "training_deadline": _tenant_deadline(tenant_id)
        }
    }
