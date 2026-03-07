def init_board():
    return [
        ["r","n","b","q","k","b","n","r"],
        ["p","p","p","p","p","p","p","p"],
        [".",".",".",".",".",".",".","."],
        [".",".",".",".",".",".",".","."],
        [".",".",".",".",".",".",".","."],
        [".",".",".",".",".",".",".","."],
        ["P","P","P","P","P","P","P","P"],
        ["R","N","B","Q","K","B","N","R"]
    ]

def square_to_index(square):
    col = ord(square[0]) - ord("a")
    row = 8 - int(square[1])
    return row, col

def index_to_square(row, col):
    file = chr(ord("a") + col)
    rank = 8 - row
    return f"{file}{rank}"

def is_path_clear(board, fr, fc, tr, tc):
    r_step = (tr - fr) // max(1, abs(tr - fr)) if tr != fr else 0
    c_step = (tc - fc) // max(1, abs(tc - fc)) if tc != fc else 0
    r, c = fr + r_step, fc + c_step
    while (r, c) != (tr, tc):
        if board[r][c] != ".": return False
        r += r_step
        c += c_step
    return True

def find_king(board, color):
    target = "K" if color == "white" else "k"
    for r in range(8):
        for c in range(8):
            if board[r][c] == target: return r, c
    return None

def can_piece_attack(board, fr, fc, tr, tc):
    piece = board[fr][fc]
    t = piece.lower()
    rd, cd = tr - fr, tc - fc
    ar, ac = abs(rd), abs(cd)
    if t == "p":
        direction = -1 if piece.isupper() else 1
        return ac == 1 and rd == direction
    if t == "r": return (rd == 0 or cd == 0) and is_path_clear(board, fr, fc, tr, tc)
    if t == "n": return (ar, ac) in [(1,2), (2,1)]
    if t == "b": return ar == ac and is_path_clear(board, fr, fc, tr, tc)
    if t == "q": return (rd == 0 or cd == 0 or ar == ac) and is_path_clear(board, fr, fc, tr, tc)
    if t == "k": return ar <= 1 and ac <= 1
    return False

def is_square_attacked(board, tr, tc, by_color):
    for r in range(8):
        for c in range(8):
            p = board[r][c]
            if p == "." or (by_color == "white" and not p.isupper()) or (by_color == "black" and not p.islower()):
                continue
            if can_piece_attack(board, r, c, tr, tc): return True
    return False

def leaves_king_in_check(board, fr, fc, tr, tc, piece):
    orig = board[tr][tc]
    board[tr][tc] = piece
    board[fr][fc] = "."
    color = "white" if piece.isupper() else "black"
    opp = "black" if color == "white" else "white"
    kr, kc = find_king(board, color)
    in_check = is_square_attacked(board, kr, kc, opp)
    board[fr][fc] = piece
    board[tr][tc] = orig
    return in_check

def is_legal_basic_move(board, piece, fr, fc, tr, tc, en_passant_target=None):
    rd, cd = tr - fr, tc - fc
    ar, ac = abs(rd), abs(cd)
    t = piece.lower()
    target = board[tr][tc]
    
    if target != "." and ((piece.isupper() and target.isupper()) or (piece.islower() and target.islower())):
        return False

    if t == "p":
        direction = -1 if piece.isupper() else 1
        if cd == 0 and rd == direction and target == ".": return True
        if ac == 1 and rd == direction and target != ".": return True
        if en_passant_target and (tr, tc) == en_passant_target and ac == 1 and rd == direction: return True
        start_row = 6 if piece.isupper() else 1
        if fr == start_row and cd == 0 and rd == 2 * direction:
            if target == "." and board[fr + direction][fc] == ".": return True
        return False
        
    if t == "r": return (rd == 0 or cd == 0) and is_path_clear(board, fr, fc, tr, tc)
    if t == "n": return (ar, ac) in [(1,2), (2,1)]
    if t == "b": return ar == ac and is_path_clear(board, fr, fc, tr, tc)
    if t == "q": return (rd == 0 or cd == 0 or ar == ac) and is_path_clear(board, fr, fc, tr, tc)
    if t == "k": return ar <= 1 and ac <= 1
    return False

def can_castle(game_dict, fr, fc, tr, tc, color):
    board = game_dict["board"]
    moved = game_dict["moved"]
    is_kingside = tc > fc
    rook_col = 7 if is_kingside else 0
    rook = board[fr][rook_col]
    if rook == ".": return False
    
    prefix = color
    if moved[f"{prefix}_king"]: return False
    rook_key = f"{prefix}_rook_h" if is_kingside else f"{prefix}_rook_a"
    if moved[rook_key]: return False
    
    step = 1 if is_kingside else -1
    c = fc + step
    while c != rook_col:
        if board[fr][c] != ".": return False
        c += step
        
    opp = "black" if color == "white" else "white"
    if is_square_attacked(board, fr, fc, opp): return False
    if is_square_attacked(board, fr, fc + step, opp): return False
    if is_square_attacked(board, fr, fc + 2*step, opp): return False
    return True

def perform_castling(board, fr, fc, tr, tc):
    is_kingside = tc > fc
    rook_col = 7 if is_kingside else 0
    king = board[fr][fc]
    rook = board[fr][rook_col]
    board[fr][fc] = "."
    board[fr][rook_col] = "."
    board[tr][tc] = king
    board[fr][tc - 1 if is_kingside else tc + 1] = rook

def update_castling_flags_dict(moved_state, color, from_col, to_col):
    prefix = color
    moved_state[f"{prefix}_king"] = True
    if to_col > from_col:
        moved_state[f"{prefix}_rook_h"] = True
    else:
        moved_state[f"{prefix}_rook_a"] = True

def update_moved_flags_dict(moved_state, piece, from_col):
    if piece == "K": moved_state["white_king"] = True
    elif piece == "k": moved_state["black_king"] = True
    elif piece == "R" and from_col == 0: moved_state["white_rook_a"] = True
    elif piece == "R" and from_col == 7: moved_state["white_rook_h"] = True
    elif piece == "r" and from_col == 0: moved_state["black_rook_a"] = True
    elif piece == "r" and from_col == 7: moved_state["black_rook_h"] = True

def get_legal_moves(game_dict, r, c):
    board = game_dict["board"]
    piece = board[r][c]
    if piece == ".": return []
    
    turn = "white" if piece.isupper() else "black"
    ep = game_dict.get("en_passant_target")
    ep_tuple = tuple(ep) if ep else None
    
    valid_moves = []
    for tr in range(8):
        for tc in range(8):
            if is_legal_basic_move(board, piece, r, c, tr, tc, ep_tuple):
                if not leaves_king_in_check(board, r, c, tr, tc, piece):
                    valid_moves.append(index_to_square(tr, tc))
    
    # Castling
    if piece.lower() == "k":
        if can_castle(game_dict, r, c, r, 6, turn):
            valid_moves.append(index_to_square(r, 6))
        if can_castle(game_dict, r, c, r, 2, turn):
            valid_moves.append(index_to_square(r, 2))
            
    return valid_moves

def has_legal_moves(game_dict):
    board = game_dict["board"]
    turn = game_dict["turn"]
    en_passant = game_dict.get("en_passant_target")
    ep = tuple(en_passant) if en_passant else None

    for r in range(8):
        for c in range(8):
            piece = board[r][c]
            if piece == "." or ("white" if piece.isupper() else "black") != turn: continue
            for tr in range(8):
                for tc in range(8):
                    if is_legal_basic_move(board, piece, r, c, tr, tc, ep):
                        if not leaves_king_in_check(board, r, c, tr, tc, piece): return True
            if piece.lower() == "k":
                if can_castle(game_dict, r, c, r, 6, turn): return True
                if can_castle(game_dict, r, c, r, 2, turn): return True
    return False

def check_game_end_logic(board, turn, en_passant_target, game_dict_context):
    if not has_legal_moves(game_dict_context):
        king_color = turn
        kr, kc = find_king(board, king_color)
        opp_color = "black" if king_color == "white" else "white"
        if is_square_attacked(board, kr, kc, opp_color):
            return f"{opp_color}_won", f"Checkmate! {opp_color.capitalize()} wins."
        else:
            return "draw", "Stalemate!"
    return None, None
