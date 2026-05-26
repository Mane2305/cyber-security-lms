from datetime import datetime, timezone
from services.firebase_service import db

DEFAULT_MODULE_TOTAL = 8

def _module_total(tenant_id: str) -> int:
    modules = db.collection("modules").where("tenant_id", "==", tenant_id).stream()
    total = len(list(modules))
    return total or DEFAULT_MODULE_TOTAL

def calculate_risk_score(uid, tenant_id) -> dict:
    progress_doc = db.collection("employee_progress").document(uid).get()
    progress = progress_doc.to_dict() if progress_doc.exists else {}

    attempts = [
        doc.to_dict()
        for doc in db.collection("quiz_attempts").where("uid", "==", uid).stream()
    ]

    modules_total = _module_total(tenant_id)
    modules_done = len(progress.get("modules_completed", []))
    base_score = 0
    reasons = []

    incomplete_modules = max(modules_total - modules_done, 0)
    if incomplete_modules:
        base_score += incomplete_modules * 5
        reasons.append(f"{incomplete_modules} modules incomplete")

    failed_attempts = sum(1 for attempt in attempts if attempt.get("passed") is False)
    if failed_attempts:
        base_score += failed_attempts * 8
        reasons.append(f"{failed_attempts} quiz failures")

    attempts_by_module = {}
    for attempt in attempts:
        module_id = attempt.get("module_id")
        if not module_id:
            continue
        attempts_by_module[module_id] = attempts_by_module.get(module_id, 0) + 1

    extra_attempts = sum(max(count - 1, 0) for count in attempts_by_module.values())
    if extra_attempts:
        base_score += extra_attempts * 5
        reasons.append(f"{extra_attempts} extra quiz retries")

    last_completed = progress.get("last_module_completed_at")
    if last_completed is None:
        base_score += 20
        reasons.append("no completed module activity")
    else:
        now = datetime.now(timezone.utc)
        if last_completed.tzinfo is None:
            last_completed = last_completed.replace(tzinfo=timezone.utc)
        inactive_days = (now - last_completed).days
        if inactive_days > 7:
            base_score += 10
            reasons.append(f"inactive for {inactive_days} days")

    risk_score = min(base_score, 100)
    if risk_score >= 70:
        level = "High"
    elif risk_score >= 40:
        level = "Medium"
    else:
        level = "Low"

    return {
        "score": risk_score,
        "level": level,
        "reasons": reasons
    }
