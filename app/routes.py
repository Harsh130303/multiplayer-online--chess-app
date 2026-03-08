from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional, List, Dict
from .db import get_db
from . import models, schemas, auth, chess_engine
import uuid

router = APIRouter()

# ----------------- Connection Manager -----------------
class ConnectionManager:
    def __init__(self):
        # game_id -> list of websockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, game_id: str, websocket: WebSocket):
        await websocket.accept()
        if game_id not in self.active_connections:
            self.active_connections[game_id] = []
        self.active_connections[game_id].append(websocket)

    def disconnect(self, game_id: str, websocket: WebSocket):
        if game_id in self.active_connections:
            if websocket in self.active_connections[game_id]:
                self.active_connections[game_id].remove(websocket)
            if not self.active_connections[game_id]:
                del self.active_connections[game_id]

    async def broadcast(self, game_id: str, message: dict):
        if game_id in self.active_connections:
            to_remove = []
            for connection in self.active_connections[game_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    to_remove.append(connection)
            
            for conn in to_remove:
                self.disconnect(game_id, conn)

manager = ConnectionManager()

# ----------------- Auth Endpoints -----------------
@router.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    return {"success": True, "username": user.username}

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

# ----------------- Game Endpoints -----------------
@router.get("/ping")
def ping():
    return {"success": True, "status": "ok"}

from datetime import datetime, timezone

@router.post("/game/create")
def create_game(game_in: Optional[schemas.GameCreate] = None, current_user: str = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    tc = game_in.time_control if game_in else None
    
    white_time = None
    black_time = None
    if tc and tc.base is not None:
        white_time = float(tc.base)
        black_time = float(tc.base)

    new_game = models.Game(
        id=str(uuid.uuid4()).lower(),
        board=chess_engine.init_board(),
        moved_state={
            "white_king": False, "white_rook_a": False, "white_rook_h": False,
            "black_king": False, "black_rook_a": False, "black_rook_h": False,
        },
        creator=current_user,
        time_control=tc.dict() if tc else None,
        white_time=white_time,
        black_time=black_time,
        last_move_at=None
    )
    db.add(new_game)
    db.commit()
    db.refresh(new_game)
    return {"success": True, "game_id": new_game.id}

@router.post("/game/{game_id}/join")
async def join_game(game_id: str, join_req: schemas.JoinRequest, current_user: str = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    color = join_req.color
    game_id = game_id.lower()
    game = db.query(models.Game).filter(models.Game.id == game_id).first()
    if not game: raise HTTPException(status_code=404, detail="Game not found")
    
    if color == "white":
        if game.white_player and game.white_player != current_user:
            raise HTTPException(status_code=400, detail="White already taken")
        game.white_player = current_user
    elif color == "black":
        if game.black_player and game.black_player != current_user:
            raise HTTPException(status_code=400, detail="Black already taken")
        game.black_player = current_user
    else:
        raise HTTPException(status_code=400, detail="Invalid color")

    # If both players are now present, the game is ready, but the clock only starts on the first move.
    pass
        
    db.commit()
    await manager.broadcast(game_id, {
        "type": "player_joined",
        "color": color,
        "username": current_user,
        "last_move_at": game.last_move_at.isoformat() if game.last_move_at else None
    })
    return {"success": True, "color": color}

@router.get("/game/{game_id}")
def get_game(game_id: str, db: Session = Depends(get_db)):
    game_id = game_id.lower()
    game = db.query(models.Game).filter(models.Game.id == game_id).first()
    if not game: raise HTTPException(status_code=404, detail="Game not found")
    
    # Calculate current time for ticking clocks if the game is ongoing
    now = datetime.now(timezone.utc).replace(tzinfo=None) # SQLAlchemy usually returns naive UTC
    w_time = game.white_time
    b_time = game.black_time
    
    if game.status == "ongoing" and game.white_player and game.black_player and game.last_move_at:
        elapsed = (now - game.last_move_at).total_seconds()
        if game.turn == "white":
            w_time = max(0, w_time - elapsed)
            if w_time <= 0:
                game.status = "black_won"
                game.game_over_reason = "Time Forfeit"
                game.white_time = 0.0 # Persist the loss
                db.commit()
                # Broadcast the timeout
                import asyncio
                asyncio.create_task(manager.broadcast(game_id, {
                    "type": "game_over",
                    "status": game.status,
                    "game_over_reason": game.game_over_reason
                }))
        else:
            b_time = max(0, b_time - elapsed)
            if b_time <= 0:
                game.status = "white_won"
                game.game_over_reason = "Time Forfeit"
                game.black_time = 0.0 # Persist the loss
                db.commit()
                # Broadcast the timeout
                import asyncio
                asyncio.create_task(manager.broadcast(game_id, {
                    "type": "game_over",
                    "status": game.status,
                    "game_over_reason": game.game_over_reason
                }))

    return {
        "success": True,
        "board": game.board,
        "turn": game.turn,
        "status": game.status,
        "players": {"white": game.white_player, "black": game.black_player},
        "time_control": game.time_control,
        "white_time": w_time,
        "black_time": b_time,
        "game_over_reason": game.game_over_reason,
        "last_move_at": game.last_move_at.isoformat() if game.last_move_at else None
    }

@router.get("/game/{game_id}/valid_moves")
def get_valid_moves(game_id: str, row: int, col: int, db: Session = Depends(get_db)):
    game_id = game_id.lower()
    game = db.query(models.Game).filter(models.Game.id == game_id).first()
    if not game: raise HTTPException(status_code=404, detail="Game not found")
    
    game_dict_context = {
        "board": game.board,
        "moved": game.moved_state,
        "en_passant_target": tuple(game.en_passant_target) if game.en_passant_target else None,
        "turn": game.turn
    }
    valid_moves = chess_engine.get_legal_moves(game_dict_context, row, col)
    return {"success": True, "valid_moves": valid_moves}

@router.post("/game/{game_id}/move")
async def make_move(game_id: str, move: schemas.Move, current_user: str = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    game_id = game_id.lower()
    game = db.query(models.Game).filter(models.Game.id == game_id).first()
    if not game: raise HTTPException(status_code=404, detail="Game not found")
    if game.status != "ongoing": return {"success": False, "error": "Game over"}
    
    # NEW GUARD: Ensure both players are joined
    if not game.white_player or not game.black_player:
        return {"success": False, "error": "Waiting for opponent to join"}

    turn = game.turn
    player_for_turn = game.white_player if turn == "white" else game.black_player
    
    if not player_for_turn or player_for_turn.lower().strip() != current_user.lower().strip(): 
        return {"success": False, "error": "Not your turn"}

    # Time Calculation
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if game.time_control and game.last_move_at:
        elapsed = (now - game.last_move_at).total_seconds()
        if turn == "white":
            game.white_time = max(0, game.white_time - elapsed)
            if game.white_time <= 0:
                game.status = "black_won"
                game.game_over_reason = "Time Forfeit"
                game.white_time = 0.0
        else:
            game.black_time = max(0, game.black_time - elapsed)
            if game.black_time <= 0:
                game.status = "white_won"
                game.game_over_reason = "Time Forfeit"
                game.black_time = 0.0

        if game.status != "ongoing":
            db.commit()
            await manager.broadcast(game_id, {
                "type": "game_over",
                "status": game.status,
                "reason": game.game_over_reason
            })
            return {"success": False, "error": "Time Out"}

        # Add increment if applicable
        inc = game.time_control.get("increment", 0)
        if turn == "white": game.white_time += inc
        else: game.black_time += inc
    
    game.last_move_at = now

    board = [row[:] for row in game.board]
    if game.draw_offer: game.draw_offer = None

    if len(move.from_square) != 2 or len(move.to_square) != 2: return {"success": False, "error": "Invalid format"}
    from_row, from_col = chess_engine.square_to_index(move.from_square)
    to_row, to_col = chess_engine.square_to_index(move.to_square)
    piece = board[from_row][from_col]
    if piece == ".": return {"success": False, "error": "No piece"}
    
    if turn == "white" and not piece.isupper(): return {"success": False, "error": "Not white piece"}
    if turn == "black" and not piece.islower(): return {"success": False, "error": "Not black piece"}

    row_diff = to_row - from_row
    col_diff = to_col - from_col
    abs_col = abs(col_diff)
    piece_type = piece.lower()

    game_dict_context = {
        "board": board,
        "moved": game.moved_state,
        "en_passant_target": tuple(game.en_passant_target) if game.en_passant_target else None,
        "turn": turn
    }

    # Castling
    if piece_type == "k" and abs_col == 2 and row_diff == 0:
        if not chess_engine.can_castle(game_dict_context, from_row, from_col, to_row, to_col, turn):
            return {"success": False, "error": "Illegal castling"}
        chess_engine.perform_castling(board, from_row, from_col, to_row, to_col)
        moved = game.moved_state.copy()
        chess_engine.update_castling_flags_dict(moved, turn, from_col, to_col)
        game.moved_state = moved
        game.turn = "black" if turn == "white" else "white"
        game.board = board
        db.commit()
        
        await manager.broadcast(game_id, {
            "type": "move",
            "board": board,
            "next_turn": game.turn,
            "status": game.status,
            "last_move": move.dict(),
            "white_time": game.white_time,
            "black_time": game.black_time,
            "last_move_at": game.last_move_at.isoformat() if game.last_move_at else None
        })
        return {"success": True, "board": board, "next_turn": game.turn}

    # Normal move validation
    en_passant_target = game_dict_context["en_passant_target"]
    if not chess_engine.is_legal_basic_move(board, piece, from_row, from_col, to_row, to_col, en_passant_target):
        return {"success": False, "error": "Illegal move"}
    if chess_engine.leaves_king_in_check(board, from_row, from_col, to_row, to_col, piece):
        return {"success": False, "error": "King in check"}

    # Apply normal move
    board[to_row][to_col] = piece
    board[from_row][from_col] = "."

    if piece.lower() == "p":
        if (piece.isupper() and to_row == 0) or (piece.islower() and to_row == 7):
            promote_to = move.promotion.lower() if move.promotion and move.promotion.lower() in ["q", "r", "b", "n"] else "q"
            new_piece = promote_to.upper() if piece.isupper() else promote_to.lower()
            board[to_row][to_col] = new_piece

    if piece.lower() == "p" and (to_row, to_col) == en_passant_target:
        board[from_row][to_col] = "."

    game.en_passant_target = None
    if piece.lower() == "p" and abs(from_row - to_row) == 2:
        game.en_passant_target = [(from_row + to_row) // 2, from_col]

    moved = game.moved_state.copy()
    chess_engine.update_moved_flags_dict(moved, piece, from_col)
    game.moved_state = moved

    new_turn = "black" if turn == "white" else "white"
    game.turn = new_turn
    game.board = board
    
    # End check
    curr_ctx = {
        "board": board, "turn": game.turn,
        "en_passant_target": tuple(game.en_passant_target) if game.en_passant_target else None,
        "moved": game.moved_state 
    }
    end_status, reason = chess_engine.check_game_end_logic(board, game.turn, curr_ctx["en_passant_target"], curr_ctx)
    
    if end_status:
        game.status = end_status
        game.game_over_reason = reason
        
    db.commit()
    
    await manager.broadcast(game_id, {
        "type": "move",
        "board": board,
        "next_turn": game.turn,
        "status": game.status,
        "game_over_reason": game.game_over_reason,
        "last_move": move.dict(),
        "white_time": game.white_time,
        "black_time": game.black_time,
        "last_move_at": game.last_move_at.isoformat() if game.last_move_at else None
    })
    
    return {"success": True, "board": board, "next_turn": game.turn}

@router.post("/game/{game_id}/resign")
async def resign_game(game_id: str, current_user: str = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    game = db.query(models.Game).filter(models.Game.id == game_id).first()
    if not game: raise HTTPException(status_code=404, detail="Game not found")
    if game.status != "ongoing": return {"success": False, "error": "Game over"}
    
    color = None
    if game.white_player and game.white_player.lower().strip() == current_user.lower().strip():
        color = "white"
    elif game.black_player and game.black_player.lower().strip() == current_user.lower().strip():
        color = "black"

    if not color: return {"success": False, "error": "Not a player"}
    
    opponent = "black" if color == "white" else "white"
    game.status = f"{opponent}_won"
    game.game_over_reason = "Resignation"
    db.commit()
    
    await manager.broadcast(game_id, {
        "type": "game_over",
        "status": game.status,
        "game_over_reason": game.game_over_reason,
        "resigned_by": color
    })
    
    return {"success": True, "status": game.status}

@router.post("/game/{game_id}/draw/offer")
async def offer_draw(game_id: str, current_user: str = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    game = db.query(models.Game).filter(models.Game.id == game_id).first()
    if not game: raise HTTPException(status_code=404, detail="Game not found")
    if game.status != "ongoing": return {"success": False, "error": "Game over"}

    color = None
    if game.white_player and game.white_player.lower().strip() == current_user.lower().strip():
        color = "white"
    elif game.black_player and game.black_player.lower().strip() == current_user.lower().strip():
        color = "black"

    if not color: return {"success": False, "error": "Not a player"}

    game.draw_offer = color
    db.commit()
    
    await manager.broadcast(game_id, {
        "type": "draw_offer",
        "from": color
    })
    
    return {"success": True, "note": "Draw offered"}

@router.post("/game/{game_id}/draw/accept")
async def accept_draw(game_id: str, current_user: str = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    game = db.query(models.Game).filter(models.Game.id == game_id).first()
    if not game: raise HTTPException(status_code=404, detail="Game not found")
    if game.status != "ongoing": return {"success": False, "error": "Game over"}

    color = None
    if game.white_player and game.white_player.lower().strip() == current_user.lower().strip():
        color = "white"
    elif game.black_player and game.black_player.lower().strip() == current_user.lower().strip():
        color = "black"

    if not color: return {"success": False, "error": "Not a player"}

    if game.draw_offer and game.draw_offer != color:
        game.status = "draw"
        game.game_over_reason = "Mutual Agreement"
        db.commit()
        
        await manager.broadcast(game_id, {
            "type": "game_over",
            "status": "draw",
            "reason": "Mutual Agreement"
        })
        return {"success": True, "status": "draw"}
    
    return {"success": False, "error": "No draw offer"}

@router.websocket("/game/{game_id}/ws")
async def websocket_endpoint(websocket: WebSocket, game_id: str, token: str = Query(...), db: Session = Depends(get_db)):
    game_id = game_id.lower()
    user = auth.get_user_from_token(token, db)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    game = db.query(models.Game).filter(models.Game.id == game_id).first()
    if not game:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(game_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(game_id, websocket)
