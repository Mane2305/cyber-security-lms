from fastapi import APIRouter, HTTPException, Depends, Header
from datetime import datetime, timezone
from services.auth_service import verify_token, get_user_from_firestore
from services.firebase_service import db
from models.module import ModuleListItem, ModuleDetail

router = APIRouter(prefix="/api/modules", tags=["modules"])

def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail={"error": "AUTH_TOKEN_MISSING"})
    token = authorization.replace("Bearer ", "")
    decoded = verify_token(token)
    uid = decoded.get("uid")
    return get_user_from_firestore(uid)

@router.get("")
def get_modules(current_user: dict = Depends(get_current_user)):
    uid = current_user.get("uid")
    
    # Fetch all 8 module documents from modules collection where tenant_id="group-sns"
    modules_ref = db.collection("modules").where("tenant_id", "==", "group-sns").stream()
    modules_data = [doc.to_dict() for doc in modules_ref]
    
    # Fetch employee_progress document for this uid
    progress_doc = db.collection("employee_progress").document(uid).get()
    if not progress_doc.exists:
        raise HTTPException(status_code=404, detail={"error": "PROGRESS_NOT_FOUND", "message": "Employee progress not found"})
    
    progress = progress_doc.to_dict()
    modules_completed = progress.get("modules_completed", [])
    modules_unlocked = progress.get("modules_unlocked", [])
    badges_earned = progress.get("badges_earned", [])
    
    earned_badge_module_ids = [b.get("module_id") for b in badges_earned if b.get("module_id")]
    
    # Construct ModuleListItem list
    result_modules = []
    for m in modules_data:
        m_id = m.get("id")
        
        status = "locked"
        if m_id in modules_completed:
            status = "completed"
        elif m_id in modules_unlocked:
            status = "unlocked"
            
        badge_earned = m_id in earned_badge_module_ids
        
        result_modules.append(ModuleListItem(
            id=m_id,
            title=m.get("title", ""),
            description=m.get("description", ""),
            slide_count=len(m.get("slides", [])),
            status=status,
            badge_earned=badge_earned,
            quiz_best_score=None,
            order=m.get("order", 0)
        ))
        
    # Sort by order field ascending
    result_modules.sort(key=lambda x: x.order)
    
    return {"success": True, "data": {"modules": [m.model_dump() for m in result_modules]}}

@router.get("/{module_id}")
def get_module_detail(module_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "employee":
        raise HTTPException(status_code=403, detail={"error": "AUTH_INSUFFICIENT_ROLE"})
        
    uid = current_user.get("uid")
    
    # Fetch employee_progress for uid
    progress_doc = db.collection("employee_progress").document(uid).get()
    if not progress_doc.exists:
        raise HTTPException(status_code=404, detail={"error": "PROGRESS_NOT_FOUND"})
        
    progress = progress_doc.to_dict()
    modules_unlocked = progress.get("modules_unlocked", [])
    
    if module_id not in modules_unlocked and module_id not in progress.get("modules_completed", []):
        raise HTTPException(status_code=403, detail={"error": "MODULE_LOCKED"})
        
    # Fetch module document
    module_doc = db.collection("modules").document(module_id).get()
    if not module_doc.exists:
        raise HTTPException(status_code=404, detail={"error": "MODULE_NOT_FOUND"})
        
    module_data = module_doc.to_dict()
    
    now = datetime.now(timezone.utc)
    
    # Update first_module_started_at
    if not progress.get("first_module_started_at"):
        db.collection("employee_progress").document(uid).update({
            "first_module_started_at": now
        })
        
    # Write to activity_log
    db.collection("activity_log").document().set({
        "tenant_id": current_user.get("tenant_id", "group-sns"),
        "uid": uid,
        "action": "module_started",
        "module_id": module_id,
        "metadata": None,
        "timestamp": now
    })
    
    detail = ModuleDetail(
        id=module_data.get("id"),
        title=module_data.get("title", ""),
        order=module_data.get("order", 0),
        slides=module_data.get("slides", [])
    )
    
    return {"success": True, "data": detail.model_dump()}
