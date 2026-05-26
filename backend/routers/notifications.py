from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from services.auth_service import verify_token, get_user_from_firestore
from services.firebase_service import db

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

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

def _sort_timestamp(value) -> float:
    if value is None:
        return 0
    if hasattr(value, "timestamp"):
        return value.timestamp()
    return 0

class MarkReadRequest(BaseModel):
    notification_id: str

@router.get("")
def get_notifications(authorization: str = Header(...)):
    user = get_current_user(authorization)
    docs = db.collection("notifications").where("uid", "==", user["uid"]).stream()
    notifications = []
    unread_count = 0

    for doc in docs:
        notification = doc.to_dict()
        if not notification.get("read", False):
            unread_count += 1
        notifications.append({
            "id": doc.id,
            "type": notification.get("type", ""),
            "message": notification.get("message", ""),
            "read": notification.get("read", False),
            "created_at": _to_iso(notification.get("created_at")),
            "_created_at_raw": notification.get("created_at")
        })

    notifications.sort(key=lambda item: _sort_timestamp(item["_created_at_raw"]), reverse=True)
    notifications = notifications[:10]
    for notification in notifications:
        notification.pop("_created_at_raw", None)

    return {
        "success": True,
        "data": {
            "notifications": notifications,
            "unread_count": unread_count
        }
    }

@router.post("/mark-read")
def mark_notification_read(request: MarkReadRequest, authorization: str = Header(...)):
    user = get_current_user(authorization)
    notification_ref = db.collection("notifications").document(request.notification_id)
    notification_doc = notification_ref.get()
    if not notification_doc.exists:
        raise HTTPException(status_code=404, detail={"error": "NOTIFICATION_NOT_FOUND"})

    notification = notification_doc.to_dict()
    if notification.get("uid") != user["uid"]:
        raise HTTPException(status_code=403, detail={"error": "AUTH_INSUFFICIENT_ROLE"})

    notification_ref.update({
        "read": True
    })

    return {
        "success": True,
        "data": {
            "marked": True
        }
    }
