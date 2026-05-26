from fastapi import HTTPException
from .firebase_service import auth, db

def verify_token(token: str) -> dict:
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        print(f"TOKEN VERIFICATION FAILED: {str(e)}")  # add this line
        raise HTTPException(
            status_code=401, 
            detail={"error": "AUTH_TOKEN_INVALID", "message": str(e)}
        )
def get_user_from_firestore(uid: str) -> dict:
    """
    Get user document from Firestore
    """
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        raise HTTPException(
            status_code=401, 
            detail={"error": "USER_NOT_FOUND", "message": "User not found in database"}
        )
        
    user_data = user_doc.to_dict()
    
    if not user_data.get("active", False):
        raise HTTPException(
            status_code=401, 
            detail={"error": "USER_NOT_FOUND", "message": "User account is deactivated"}
        )
        
    return user_data
