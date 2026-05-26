from services.firebase_service import db

def get_manager_team_uids(manager_uid: str, tenant_id: str) -> list:
    manager_doc = db.collection("users").document(manager_uid).get()
    manager = manager_doc.to_dict() if manager_doc.exists else {}
    team_uids = set(manager.get("team_uids", []))

    user_docs = db.collection("users").where("tenant_id", "==", tenant_id).stream()
    for doc in user_docs:
        user = doc.to_dict()
        if user.get("manager_uid") == manager_uid:
            team_uids.add(user.get("uid"))

    return [uid for uid in team_uids if uid]

def assign_employee_to_manager(employee_uid: str, manager_uid: str):
    employee_ref = db.collection("users").document(employee_uid)
    employee_doc = employee_ref.get()
    if not employee_doc.exists:
        return

    employee = employee_doc.to_dict()
    previous_manager_uid = employee.get("manager_uid")
    if previous_manager_uid and previous_manager_uid != manager_uid:
        previous_manager_ref = db.collection("users").document(previous_manager_uid)
        previous_manager_doc = previous_manager_ref.get()
        if previous_manager_doc.exists:
            previous_manager = previous_manager_doc.to_dict()
            previous_team = [
                uid for uid in previous_manager.get("team_uids", [])
                if uid != employee_uid
            ]
            previous_manager_ref.update({"team_uids": previous_team})

    manager_ref = db.collection("users").document(manager_uid)
    manager_doc = manager_ref.get()
    if not manager_doc.exists:
        return

    manager = manager_doc.to_dict()
    team_uids = manager.get("team_uids", [])
    if employee_uid not in team_uids:
        team_uids.append(employee_uid)

    employee_ref.update({"manager_uid": manager_uid})
    manager_ref.update({"team_uids": team_uids})

def clear_employee_manager(employee_uid: str):
    employee_ref = db.collection("users").document(employee_uid)
    employee_doc = employee_ref.get()
    if not employee_doc.exists:
        return

    employee = employee_doc.to_dict()
    previous_manager_uid = employee.get("manager_uid")
    if previous_manager_uid:
        previous_manager_ref = db.collection("users").document(previous_manager_uid)
        previous_manager_doc = previous_manager_ref.get()
        if previous_manager_doc.exists:
            previous_manager = previous_manager_doc.to_dict()
            previous_team = [
                uid for uid in previous_manager.get("team_uids", [])
                if uid != employee_uid
            ]
            previous_manager_ref.update({"team_uids": previous_team})

    employee_ref.update({"manager_uid": None})
