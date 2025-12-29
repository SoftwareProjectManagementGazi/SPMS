from pydantic import BaseModel, EmailStr

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
    is_active: bool
