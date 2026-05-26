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

class UpdateUserRequest(BaseModel):
    uid: str
    email: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = Field(default=None, pattern='^(employee|manager)$')
    active: Optional[bool] = None
    manager_uid: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    new_password: str

class UserResponse(BaseModel):
    uid: str
    email: str
    name: str
    role: str
    tenant_id: str
    manager_uid: Optional[str] = None
    team_uids: List[str] = []
