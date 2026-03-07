from sqlalchemy import Column, Integer, String, Boolean, JSON, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .db import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class Game(Base):
    __tablename__ = "games"

    id = Column(String, primary_key=True, default=generate_uuid)
    board = Column(JSON)
    turn = Column(String, default="white")
    status = Column(String, default="ongoing")
    
    white_player = Column(String, nullable=True) # Storing username directly for simplicity
    black_player = Column(String, nullable=True) 
    
    # Game state tracking
    moved_state = Column(JSON) # Dictionary: {"white_king": False, ...}
    en_passant_target = Column(JSON, nullable=True) # List [row, col] or None
    draw_offer = Column(String, nullable=True)
    game_over_reason = Column(String, nullable=True)
    creator = Column(String, nullable=True)

    # Chess Clock
    time_control = Column(JSON, nullable=True) # e.g. {"base": 600, "increment": 1}
    white_time = Column(Float, nullable=True)
    black_time = Column(Float, nullable=True)
    last_move_at = Column(DateTime, nullable=True)
