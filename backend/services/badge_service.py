from services.firebase_service import db

MODULE_COUNT = 8

def _to_iso(value):
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)

def get_all_badges_for_employee(uid: str, tenant_id: str) -> list:
    modules = []
    module_docs = db.collection("modules").where("tenant_id", "==", tenant_id).stream()
    for doc in module_docs:
        modules.append(doc.to_dict())

    modules.sort(key=lambda module: module.get("order", 0))
    modules = modules[:MODULE_COUNT]

    progress_doc = db.collection("employee_progress").document(uid).get()
    progress = progress_doc.to_dict() if progress_doc.exists else {}
    earned_badges = progress.get("badges_earned", [])
    earned_by_module = {
        badge.get("module_id"): badge
        for badge in earned_badges
        if badge.get("module_id")
    }

    badges = []
    for module in modules:
        module_id = module.get("id")
        earned_badge = earned_by_module.get(module_id)
        badges.append({
            "module_id": module_id,
            "module_title": module.get("title", ""),
            "badge_name": module.get("badge_name", ""),
            "badge_description": module.get("badge_description", ""),
            "earned": earned_badge is not None,
            "earned_at": _to_iso(earned_badge.get("earned_at")) if earned_badge else None
        })

    return badges
