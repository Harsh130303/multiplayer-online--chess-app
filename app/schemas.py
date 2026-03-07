from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    username: str
    password: str

class TimeControl(BaseModel):
    base: Optional[int] = None  # Initial time in seconds (e.g. 600 for 10 min)
    increment: int = 0 # Increment in seconds (e.g. 1)

class GameCreate(BaseModel):
    time_control: Optional[TimeControl] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class Move(BaseModel):
    from_square: str
    to_square: str
    promotion: Optional[str] = None

class JoinRequest(BaseModel):
    color: str
