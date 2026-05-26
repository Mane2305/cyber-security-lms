from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timezone
import secrets
import string
from firebase_admin import auth as firebase_auth
from models.user import LoginRequest, CreateUserRequest, DeactivateUserRequest, UserResponse
from services.auth_service import verify_token, get_user_from_firestore
from services.firebase_service import db

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer()

def generate_password(length=8):
    characters = string.ascii_letters + string.digits
    return ''.join(secrets.choice(characters) for i in range(length))

def get_current_user_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    return verify_token(token)

def get_current_admin(token_data: dict = Depends(get_current_user_token)):
    uid = token_data.get("uid")
    user_data = get_user_from_firestore(uid)
    
    if user_data.get("role") != "admin":
        raise HTTPException(
            status_code=403, 
            detail={"error": "AUTH_INSUFFICIENT_ROLE", "message": "Admin privileges required"}
        )
    return user_data

@router.post("/login")
def login(request: LoginRequest):
    decoded_token = verify_token(request.firebase_token)
    uid = decoded_token.get("uid")
    
    user_data = get_user_from_firestore(uid)
    
    # Update last_login_at
    db.collection("users").document(uid).update({
        "last_login_at": datetime.now(timezone.utc)
    })
    
    # Write activity_log
    activity_log_ref = db.collection("activity_log").document()
    activity_log_ref.set({
        "tenant_id": user_data.get("tenant_id", "group-sns"),
        "uid": uid,
        "action": "login",
        "module_id": None,
        "metadata": None,
        "timestamp": datetime.now(timezone.utc)
    })
    
    # Return UserResponse wrapped in success envelope
    return {"success": True, "data": UserResponse(**user_data).model_dump()}

@router.post("/create-user")
def create_user(request: CreateUserRequest, admin_user: dict = Depends(get_current_admin)):
    temporary_password = generate_password()
    
    # Create Firebase Auth user
    try:
        user_record = firebase_auth.create_user(
            email=request.email,
            password=temporary_password,
            display_name=request.name
        )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail={"error": "FIREBASE_USER_CREATION_FAILED", "message": str(e)}
        )
        
    uid = user_record.uid
    tenant_id = "group-sns"
    now = datetime.now(timezone.utc)
    
    user_data = {
        "uid": uid,
        "tenant_id": tenant_id,
        "email": request.email,
        "name": request.name,
        "role": request.role,
        "active": True,
        "manager_uid": request.manager_uid,
        "team_uids": [],
        "created_at": now,
        "created_by_uid": admin_user.get("uid"),
        "last_login_at": None
    }
    
    employee_progress_data = {
        "uid": uid,
        "tenant_id": tenant_id,
        "modules_completed": [],
        "modules_unlocked": ["module_01_phishing"],
        "badges_earned": [],
        "certificate_issued": False,
        "certificate_id": None,
        "certificate_issued_at": None,
        "fraud_flagged": False,
        "first_module_started_at": None,
        "last_module_completed_at": None,
        "total_completion_minutes": None,
        "created_at": now,
        "updated_at": now
    }
    
    # Batch write for atomicity
    batch = db.batch()
    
    user_ref = db.collection("users").document(uid)
    batch.set(user_ref, user_data)
    
    progress_ref = db.collection("employee_progress").document(uid)
    batch.set(progress_ref, employee_progress_data)
    
    activity_log_ref = db.collection("activity_log").document()
    batch.set(activity_log_ref, {
        "tenant_id": tenant_id,
        "uid": admin_user.get("uid"),
        "action": "user_created",
        "module_id": None,
        "metadata": {"created_uid": uid, "role": request.role},
        "timestamp": now
    })
    
    batch.commit()
    
    response_data = UserResponse(**user_data).model_dump()
    response_data["temporary_password"] = temporary_password
    
    return {"success": True, "data": response_data}

@router.post("/deactivate-user")
def deactivate_user(request: DeactivateUserRequest, admin_user: dict = Depends(get_current_admin)):
    uid = request.uid
    
    # Check if user exists in DB first
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()
    if not user_doc.exists:
        raise HTTPException(
            status_code=404,
            detail={"error": "USER_NOT_FOUND", "message": "User not found in database"}
        )
        
    try:
        firebase_auth.update_user(uid, disabled=True)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail={"error": "FIREBASE_UPDATE_FAILED", "message": str(e)}
        )
        
    now = datetime.now(timezone.utc)
        
    batch = db.batch()
    batch.update(user_ref, {"active": False})
    
    activity_log_ref = db.collection("activity_log").document()
    batch.set(activity_log_ref, {
        "tenant_id": "group-sns",
        "uid": admin_user.get("uid"),
        "action": "user_deactivated",
        "module_id": None,
        "metadata": {"deactivated_uid": uid},
        "timestamp": now
    })
    
    batch.commit()
    
    return {"success": True, "data": {"uid": uid, "deactivated": True}}
