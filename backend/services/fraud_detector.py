from services.firebase_service import db

def _minutes_between(start, end):
    return int((end - start).total_seconds() // 60)

def check_fraud(uid: str, tenant_id: str) -> bool:
    progress_doc = db.collection("employee_progress").document(uid).get()
    if not progress_doc.exists:
        return False

    progress = progress_doc.to_dict()
    first_started = progress.get("first_module_started_at")
    last_completed = progress.get("last_module_completed_at")
    if not first_started or not last_completed:
        return False

    tenant_doc = db.collection("tenants").document(tenant_id).get()
    tenant_data = tenant_doc.to_dict() if tenant_doc.exists else {}
    settings = tenant_data.get("settings", {})
    threshold_minutes = settings.get("fraud_detection_minutes", 20)

    return _minutes_between(first_started, last_completed) < threshold_minutes
