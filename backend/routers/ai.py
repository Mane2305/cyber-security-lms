from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from services.auth_service import verify_token, get_user_from_firestore
from services.firebase_service import db
from services.assistant import generate_assistant_response

router = APIRouter(prefix="/api/ai", tags=["ai"])

def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail={"error": "AUTH_TOKEN_MISSING"})
    token = authorization.replace("Bearer ", "")
    decoded = verify_token(token)
    uid = decoded.get("uid")
    return get_user_from_firestore(uid)

class AskRequest(BaseModel):
    module_id: str
    question: str

@router.post("/ask")
def ask_assistant(request: AskRequest, authorization: str = Header(...)):
    user = get_current_user(authorization)
    
    if user.get("role") != "employee":
        raise HTTPException(status_code=403, detail={"error": "AUTH_INSUFFICIENT_ROLE"})
    
    module_doc = db.collection("modules").document(request.module_id).get()
    if not module_doc.exists:
        raise HTTPException(status_code=404, detail={"error": "MODULE_NOT_FOUND"})
    
    module_data = module_doc.to_dict()
    
    # Build module content string from slides
    slides = module_data.get("slides", [])
    content_parts = [f"Module: {module_data.get('title', '')}"]
    for slide in slides:
        content_parts.append(f"\n{slide.get('heading', '')}\n{slide.get('body', '')}")
        for point in slide.get("key_points", []):
            content_parts.append(f"- {point}")
    module_content = "\n".join(content_parts)
    
    answer = generate_assistant_response(request.module_id, module_content, request.question)
    
    return {
        "success": True,
        "data": {
            "answer": answer
        }
    }
