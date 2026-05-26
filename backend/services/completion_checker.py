from services.firebase_service import db

def check_module_completion(uid: str, tenant_id: str) -> int:
    """Returns the count of modules completed by the employee."""
    progress_ref = db.collection("employee_progress").document(uid)
    progress = progress_ref.get()
    if not progress.exists:
        return 0
    data = progress.to_dict()
    return len(data.get("modules_completed", []))

def is_certificate_eligible(uid: str, tenant_id: str) -> bool:
    """Returns True if employee has completed all 8 modules."""
    return check_module_completion(uid, tenant_id) >= 8
