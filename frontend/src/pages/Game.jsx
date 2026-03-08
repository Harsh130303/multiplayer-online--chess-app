import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { AuthContext } from '../context/AuthContext';
import ChessBoard from '../components/ChessBoard';
import Timer from '../components/Timer';

const Game = () => {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [gameState, setGameState] = useState(null);
    const [myColor, setMyColor] = useState(null);
    const [lastMove, setLastMove] = useState(null);
    const [validMoves, setValidMoves] = useState([]);
    const [drawOffer, setDrawOffer] = useState(null); // 'white', 'black', or null

    const fetchGame = useCallback(async () => {
        try {
            const res = await client.get(`/game/${gameId}`);
            if (res.data.success) {
                setGameState(res.data);
                determineColor(res.data);
            }
        } catch (err) {
            console.error('Failed to load game', err);
        }
    }, [gameId, user?.username]);

    const determineColor = (game) => {
        if (!user) return;
        const myName = user.username.trim().toLowerCase();
        const whiteName = (game.players.white || '').trim().toLowerCase();
        const blackName = (game.players.black || '').trim().toLowerCase();

        if (whiteName === myName) {
            setMyColor('white');
        } else if (blackName === myName) {
            setMyColor('black');
        } else {
            setMyColor(null);
        }
    };

    const fetchValidMoves = async (row, col) => {
        try {
            const res = await client.get(`/game/${gameId}/valid_moves`, { params: { row, col } });
            if (res.data.success) {
                setValidMoves(res.data.valid_moves);
            }
        } catch (err) {
            console.error("Failed to fetch moves", err);
        }
    };

    const handleJoin = async (color) => {
        try {
            const res = await client.post(`/game/${gameId}/join`, { color });
            if (res.data.success) {
                fetchGame();
            }
        } catch (err) {
            const detail = err.response?.data?.detail;
            const message = Array.isArray(detail) ? detail[0].msg : (detail || 'Failed to join');
            alert(message);
        }
    };

    const handleResign = async () => {
        if (!window.confirm("Are you sure you want to resign?")) return;
        try {
            await client.post(`/game/${gameId}/resign`);
        } catch (err) {
            console.error('Resign failed', err);
        }
    };

    const handleOfferDraw = async () => {
        try {
            await client.post(`/game/${gameId}/draw/offer`);
            alert("Draw offer sent!");
        } catch (err) {
            console.error('Draw offer failed', err);
        }
    };

    const handleAcceptDraw = async () => {
        try {
            await client.post(`/game/${gameId}/draw/accept`);
        } catch (err) {
            console.error('Accept draw failed', err);
        }
    };

    const handleMove = async (from, to) => {
        if (!gameState.players.white || !gameState.players.black) {
            alert("Waiting for opponent to join!");
            return;
        }
        try {
            const res = await client.post(`/game/${gameId}/move`, { from_square: from, to_square: to });
            if (!res.data.success) {
                alert(res.data.error);
            }
        } catch (err) {
            console.error('Move failed', err);
        }
    };

    useEffect(() => {
        fetchGame();
        if (!user) return;

        const token = localStorage.getItem('token');
        const gid = gameId.toLowerCase();
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${protocol}//${window.location.host}/api/game/${gid}/ws?token=${token}`);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'move') {
                setGameState(prev => ({
                    ...prev,
                    board: data.board,
                    turn: data.next_turn,
                    status: data.status,
                    game_over_reason: data.game_over_reason,
                    white_time: data.white_time,
                    black_time: data.black_time,
                    last_move_at: data.last_move_at
                }));
                if (data.last_move) setLastMove(data.last_move);
                setValidMoves([]);
            } else if (data.type === 'player_joined') {
                setGameState(prev => ({
                    ...prev,
                    players: { ...prev.players, [data.color]: data.username },
                    last_move_at: data.last_move_at || prev.last_move_at
                }));

                // Only set myColor if we don't have one and this is us
                const myName = user.username.trim().toLowerCase();
                const joinedName = (data.username || '').trim().toLowerCase();
                if (joinedName === myName) {
                    setMyColor(data.color);
                }
            } else if (data.type === 'game_over') {
                setGameState(prev => ({ ...prev, status: data.status, game_over_reason: data.game_over_reason }));
                setDrawOffer(null);
            } else if (data.type === 'draw_offer') {
                setDrawOffer(data.from);
            }
        };

        return () => ws.close();
    }, [gameId, user?.username, fetchGame]);

    if (!gameState) return (
        <div style={{ background: '#0f172a', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            Loading...
        </div>
    );

    const isBlack = myColor === 'black';
    const isMyTurn = gameState.turn === myColor;
    const resultMessage = (() => {
        if (gameState.status === 'draw') return "Draw";
        const winner = gameState.status.split('_')[0];
        if (!myColor) return `${winner.toUpperCase()} Won`;
        return winner === myColor ? "You Won! 🏆" : "You Lost";
    })();

    const isSpectator = !myColor;

    return (
        <div style={{
            minHeight: '100vh',
            width: '100vw',
            background: 'radial-gradient(circle at center, #1e293b 0%, #020617 100%)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px',
            fontFamily: "'Inter', sans-serif",
            boxSizing: 'border-box',
            overflow: 'hidden',
            '--sq-size': 'clamp(35px, min(9vw, 9.5vh), 62px)'
        }}>
            <div style={{
                display: 'flex',
                gap: '20px',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                width: '100%',
                maxWidth: '1300px'
            }}>
                {/* Board Column */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    flexShrink: 0,
                    position: 'relative',
                    alignItems: 'center',
                    width: 'calc(var(--sq-size) * 8 + 40px)' // Match board width + padding
                }}>
                    {/* Top Player Row (Opponent or Black) */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', width: '100%', alignItems: 'center' }}>
                        <span style={{
                            fontSize: '1rem',
                            color: '#94a3b8',
                            fontWeight: '600',
                            maxWidth: '180px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {isBlack ? (gameState.players.white || 'Waiting...') : (gameState.players.black || 'Waiting...')}
                        </span>
                        <Timer
                            time={isBlack ? gameState.white_time : gameState.black_time}
                            isActive={gameState.status === 'ongoing' && gameState.turn === (isBlack ? 'white' : 'black') && gameState.last_move_at && gameState.players.white && gameState.players.black}
                            onTimeout={() => fetchGame()}
                        />
                    </div>

                    <ChessBoard
                        board={gameState.board}
                        onMove={handleMove}
                        turn={gameState.turn}
                        myColor={myColor}
                        lastMove={lastMove}
                        validMoves={validMoves}
                        onSelect={fetchValidMoves}
                        onDeselect={() => setValidMoves([])}
                    />

                    {/* Bottom Player Row (You or White) */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', width: '100%', alignItems: 'center' }}>
                        <span style={{
                            fontSize: '0.9rem',
                            color: '#94a3b8',
                            fontWeight: '700',
                            maxWidth: '220px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {isSpectator ? (isBlack ? gameState.players.black : gameState.players.white) : "YOU"}
                        </span>
                        <Timer
                            time={isBlack ? gameState.black_time : gameState.white_time}
                            isActive={gameState.status === 'ongoing' && gameState.turn === (isBlack ? 'black' : 'white') && gameState.last_move_at && gameState.players.white && gameState.players.black}
                            onTimeout={() => fetchGame()}
                        />
                    </div>

                    {/* Join Overlay (Inside Board) */}
                    {isSpectator && gameState.status === 'ongoing' && (gameState.players.white === null || gameState.players.black === null) && (
                        <div style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(2, 6, 23, 0.7)',
                            backdropFilter: 'blur(8px)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10,
                            borderRadius: '12px'
                        }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '20px' }}>Pick Your Side</h2>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                {!gameState.players.white && (
                                    <button onClick={() => handleJoin('white')} style={{ padding: '10px 20px', borderRadius: '10px', background: 'white', color: 'black', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>White</button>
                                )}
                                {!gameState.players.black && (
                                    <button onClick={() => handleJoin('black')} style={{ padding: '10px 20px', borderRadius: '10px', background: '#334155', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Black</button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Column */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px',
                    width: '320px',
                    padding: '20px',
                    background: 'rgba(30, 41, 59, 0.4)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}>
                    {/* Game info header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Game ID</span>
                            <span style={{ fontSize: '1rem', color: '#818cf8', fontWeight: '700', fontFamily: 'monospace' }}>{gameId.slice(0, 12)}</span>
                        </div>
                        <button
                            onClick={() => { navigator.clipboard.writeText(gameId); alert('Copied!'); }}
                            style={{ background: 'rgba(99, 102, 241, 0.1)', border: 'none', color: '#818cf8', padding: '8px 16px', borderRadius: '10px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            Copy ID
                        </button>
                    </div>

                    {/* Status Display */}
                    <div style={{
                        padding: '24px',
                        background: 'rgba(15, 23, 42, 0.3)',
                        borderRadius: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px',
                        border: '1px solid rgba(255,255,255,0.03)'
                    }}>
                        {gameState.status === 'ongoing' ? (
                            <>
                                <span style={{
                                    fontSize: '1rem',
                                    fontWeight: '800',
                                    color: (gameState.players.white && gameState.players.black) ? '#22c55e' : '#f59e0b',
                                    letterSpacing: '0.05em'
                                }}>
                                    {(!gameState.players.white || !gameState.players.black) ? "WAITING FOR OPPONENT" : (isMyTurn ? "YOUR TURN" : "OPPONENT'S TURN")}
                                </span>
                                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
                                    {isBlack ? gameState.players.white : gameState.players.black} (W) vs {isBlack ? gameState.players.black : gameState.players.white} (B)
                                </span>
                            </>
                        ) : (
                            <>
                                <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#ef4444', letterSpacing: '0.1em' }}>GAME OVER</span>
                                <span style={{ fontSize: '1.2rem', color: 'white', fontWeight: '700' }}>{resultMessage}</span>
                                <div style={{
                                    marginTop: '8px',
                                    padding: '8px 16px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    borderRadius: '10px',
                                    color: '#fca5a5',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    textAlign: 'center',
                                    border: '1px solid rgba(239, 68, 68, 0.2)'
                                }}>
                                    {gameState.game_over_reason}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Interaction Overlays for board are handled inside the board column already */}

                    {/* Draw Offer */}
                    {drawOffer && drawOffer !== myColor && gameState.status === 'ongoing' && (
                        <div style={{
                            background: 'rgba(99, 102, 241, 0.1)',
                            padding: '16px',
                            borderRadius: '16px',
                            border: '1px solid #6366f1',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                        }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center' }}>Draw offered</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={handleAcceptDraw} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: '#6366f1', color: 'white', border: 'none', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>Accept</button>
                                <button onClick={() => setDrawOffer(null)} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'transparent', color: '#94a3b8', border: '1px solid #334155', fontSize: '0.8rem', cursor: 'pointer' }}>Decline</button>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    {myColor && gameState.status === 'ongoing' && (
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={handleResign} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>Resign</button>
                            <button onClick={handleOfferDraw} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.1)', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>Draw</button>
                        </div>
                    )}

                    <button
                        onClick={() => navigate('/')}
                        style={{ padding: '14px', borderRadius: '14px', background: 'transparent', border: '1px solid #334155', color: '#64748b', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', marginTop: 'auto' }}
                    >
                        Return Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Game;
