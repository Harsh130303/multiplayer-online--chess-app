import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import client from '../api/client';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [gameId, setGameId] = useState('');

    const timeOptions = [
        { label: '1 min', base: 60, increment: 0 },
        { label: '1 + 1 sec', base: 60, increment: 1 },
        { label: '3 min', base: 180, increment: 0 },
        { label: '3 + 1 sec', base: 180, increment: 1 },
        { label: '10 min', base: 600, increment: 0 },
        { label: '10 + 1 sec', base: 600, increment: 1 },
        { label: '30 min', base: 1800, increment: 0 },
        { label: 'No Limit', base: null, increment: 0 },
    ];

    const [timeControl, setTimeControl] = useState(timeOptions[0]);

    const createGame = async () => {
        try {
            const payload = timeControl.base ? { time_control: timeControl } : {};
            const response = await client.post('game/create', payload);
            if (response.data.success) {
                navigate(`/game/${response.data.game_id}`);
            } else {
                alert(response.data.error || "Failed to create game");
            }
        } catch (error) {
            console.error("Failed to create game", error);
            if (error.response?.status !== 401) {
                alert("Error creating game. Please try logging in again.");
            }
        }
    };

    const joinGame = () => {
        if (gameId.trim()) {
            navigate(`/game/${gameId.trim()}`);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            width: '100vw',
            background: 'radial-gradient(circle at center, #1e293b 0%, #020617 100%)',
            color: 'white',
            fontFamily: "'Inter', sans-serif",
            padding: '20px',
            boxSizing: 'border-box'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 style={{
                    fontSize: 'clamp(3rem, 10vw, 6rem)',
                    fontWeight: '900',
                    background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    color: 'transparent', // Compatibility
                    letterSpacing: '-0.05em',
                    lineHeight: '0.9',
                    margin: 0
                }}>
                    CHESS
                </h1>
                <p style={{
                    color: '#94a3b8',
                    marginTop: '16px',
                    fontSize: '1.1rem',
                    fontWeight: '500',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase'
                }}>
                    Welcome back, <span style={{ color: '#f8fafc', fontWeight: '800' }}>{user?.username}</span>
                </p>
            </div>

            <div style={{
                background: 'rgba(30, 41, 59, 0.4)',
                padding: '60px 80px',
                borderRadius: '40px',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                width: '100%',
                maxWidth: '720px',
                display: 'flex',
                flexDirection: 'column',
                gap: '30px',
                boxSizing: 'border-box'
            }}>
                <div style={{ width: '100%' }}>
                    <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.85rem', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Time Control
                    </label>
                    <select
                        value={timeOptions.findIndex(o => o.base === timeControl.base && o.increment === timeControl.increment)}
                        style={{
                            width: '100%',
                            padding: '16px 20px',
                            borderRadius: '16px',
                            background: '#0f172a',
                            border: '1px solid #334155',
                            color: 'white',
                            cursor: 'pointer',
                            outline: 'none',
                            fontSize: '1.1rem',
                            fontWeight: '500',
                            appearance: 'none',
                            transition: 'border-color 0.2s'
                        }}
                        onChange={(e) => {
                            const opt = timeOptions[e.target.value];
                            setTimeControl({ base: opt.base, increment: opt.increment });
                        }}
                    >
                        {timeOptions.map((opt, i) => (
                            <option key={i} value={i}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={createGame}
                    style={{
                        width: '100%',
                        padding: '18px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        color: 'white',
                        border: 'none',
                        fontSize: '1.2rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.4)'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                    Create New Game
                </button>

                <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0', color: '#475569' }}>
                    <div style={{ flex: 1, height: '1px', background: '#334155' }}></div>
                    <span style={{ margin: '0 20px', fontSize: '0.8rem', fontWeight: 'bold' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: '#334155' }}></div>
                </div>

                <div style={{ display: 'flex', gap: '15px', width: '100%' }}>
                    <input
                        type="text"
                        placeholder="Enter Game ID"
                        value={gameId}
                        onChange={(e) => setGameId(e.target.value)}
                        style={{
                            flex: 1,
                            padding: '16px 20px',
                            borderRadius: '16px',
                            background: '#0f172a',
                            border: '1px solid #334155',
                            color: 'white',
                            outline: 'none',
                            fontSize: '1.1rem'
                        }}
                    />
                    <button
                        onClick={joinGame}
                        style={{
                            padding: '0 40px',
                            borderRadius: '16px',
                            background: '#1e293b',
                            border: '1px solid #475569',
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '1.1rem',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#334155'}
                        onMouseOut={(e) => e.target.style.background = '#1e293b'}
                    >
                        Join Room
                    </button>
                </div>

                <button
                    onClick={logout}
                    style={{
                        marginTop: '10px',
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        opacity: '0.8',
                        transition: 'opacity 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.opacity = '1'}
                    onMouseOut={(e) => e.target.style.opacity = '0.8'}
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default Home;
