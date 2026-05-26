from pydantic import BaseModel, Field
from typing import Optional, List

class LoginRequest(BaseModel):
    firebase_token: str

class CreateUserRequest(BaseModel):
    email: str
    name: str
    role: str = Field(pattern='^(employee|manager)$')
    manager_uid: Optional[str] = None

class DeactivateUserRequest(BaseModel):
    uid: str

class UserResponse(BaseModel):
    uid: str
    email: str
    name: str
    role: str
    tenant_id: str
    manager_uid: Optional[str] = None
    team_uids: List[str] = []
