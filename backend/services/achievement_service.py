from services.firebase_service import db

DEFAULT_MODULE_TOTAL = 8

def _to_iso(value):
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)

def _module_total(tenant_id: str) -> int:
    modules = db.collection("modules").where("tenant_id", "==", tenant_id).stream()
    total = len(list(modules))
    return total or DEFAULT_MODULE_TOTAL

def _sort_timestamp(value):
    if value is None:
        return 0
    if hasattr(value, "timestamp"):
        return value.timestamp()
    return 0

def check_achievements(uid, tenant_id) -> list:
    progress_doc = db.collection("employee_progress").document(uid).get()
    progress = progress_doc.to_dict() if progress_doc.exists else {}
    attempts = [
        doc.to_dict()
        for doc in db.collection("quiz_attempts").where("uid", "==", uid).stream()
    ]

    achievements = []

    perfect_attempts = [
        attempt for attempt in attempts
        if attempt.get("score") == 100
    ]
    if perfect_attempts:
        perfect_attempts.sort(key=lambda item: _sort_timestamp(item.get("submitted_at") or item.get("started_at")))
        earned_at = perfect_attempts[0].get("submitted_at") or perfect_attempts[0].get("started_at")
        achievements.append({
            "id": "perfect_score",
            "name": "Perfect Score",
            "description": "Scored 100% on a quiz",
            "earned": True,
            "earned_at": _to_iso(earned_at)
        })

    completed_modules = progress.get("modules_completed", [])
    if completed_modules:
        failed_modules = {
            attempt.get("module_id")
            for attempt in attempts
            if attempt.get("module_id") in completed_modules and attempt.get("passed") is False
        }
        if not failed_modules:
            achievements.append({
                "id": "first_try_champion",
                "name": "First Try Champion",
                "description": "Passed completed modules without failed attempts",
                "earned": True,
                "earned_at": _to_iso(progress.get("last_module_completed_at"))
            })

    modules_total = _module_total(tenant_id)
    first_started = progress.get("first_module_started_at")
    last_completed = progress.get("last_module_completed_at")
    if len(completed_modules) >= modules_total and first_started and last_completed:
        if (last_completed - first_started).total_seconds() < 24 * 60 * 60:
            achievements.append({
                "id": "speed_learner",
                "name": "Speed Learner",
                "description": "Completed all modules within 24 hours",
                "earned": True,
                "earned_at": _to_iso(last_completed)
            })

    attempts_by_module = {}
    for attempt in attempts:
        module_id = attempt.get("module_id")
        if not module_id:
            continue
        attempts_by_module.setdefault(module_id, []).append(attempt)

    persistent_earned_at = None
    for module_attempts in attempts_by_module.values():
        failed_count = sum(1 for attempt in module_attempts if attempt.get("passed") is False)
        passed_attempts = [attempt for attempt in module_attempts if attempt.get("passed") is True]
        if failed_count >= 2 and passed_attempts:
            passed_attempts.sort(key=lambda item: _sort_timestamp(item.get("submitted_at") or item.get("started_at")))
            persistent_earned_at = passed_attempts[-1].get("submitted_at") or passed_attempts[-1].get("started_at")
            break
    if persistent_earned_at:
        achievements.append({
            "id": "persistent",
            "name": "Persistent",
            "description": "Failed a quiz multiple times but eventually passed",
            "earned": True,
            "earned_at": _to_iso(persistent_earned_at)
        })

    if progress.get("certificate_issued") is True:
        achievements.append({
            "id": "certified",
            "name": "Certified",
            "description": "Earned the CyberShield LMS certificate",
            "earned": True,
            "earned_at": _to_iso(progress.get("certificate_issued_at"))
        })

    return achievements
