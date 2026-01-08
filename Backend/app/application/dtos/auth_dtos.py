from pydantic import BaseModel, EmailStr
from typing import Optional

class RoleDTO(BaseModel):
    name: str
    description: Optional[str] = None
    
class UserRegisterDTO(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLoginDTO(BaseModel):
    email: EmailStr
    password: str

class TokenDTO(BaseModel):
    access_token: str
    token_type: str

class UserResponseDTO(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    avatar: Optional[str] = None
    is_active: bool
    role: Optional[RoleDTO] = None  

    class Config:
        from_attributes = True # ORM nesnelerini Pydantic'e çevirmek için şart

class UserListDTO(BaseModel):
    id: int
    email: str
    username: str
    avatar_url: str | None = None        