import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!username.trim() || !password.trim()) {
            setError('Please fill in all fields.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setIsLoading(true);
        try {
            const success = await register(username.trim(), password);
            if (success) {
                setSuccessMessage('Registration successful! Redirecting to login...');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setError('Registration failed. Username might already be taken.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
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
            {/* Header / Brand */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h1 style={{
                    fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
                    fontWeight: '900',
                    background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    color: 'transparent',
                    letterSpacing: '-0.05em',
                    lineHeight: '1.0',
                    margin: 0
                }}>
                    CHESS
                </h1>
                <p style={{
                    color: '#94a3b8',
                    marginTop: '10px',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase'
                }}>
                    Real-time Multiplayer Platform
                </p>
            </div>

            {/* Register Card */}
            <div style={{
                background: 'rgba(30, 41, 59, 0.4)',
                padding: '40px 50px',
                borderRadius: '32px',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                width: '100%',
                maxWidth: '460px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
            }}>
                <h2 style={{
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    margin: '0 0 10px 0',
                    textAlign: 'center',
                    color: '#f8fafc'
                }}>
                    Create Account
                </h2>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#fca5a5',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div style={{
                        background: 'rgba(34, 197, 94, 0.15)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        color: '#86efac',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        textAlign: 'center'
                    }}>
                        {successMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            color: '#94a3b8',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            Username
                        </label>
                        <input
                            type="text"
                            placeholder="Choose a username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '14px 18px',
                                borderRadius: '12px',
                                background: '#0f172a',
                                border: '1px solid #334155',
                                color: 'white',
                                outline: 'none',
                                fontSize: '1rem',
                                boxSizing: 'border-box',
                                transition: 'border-color 0.2s, box-shadow 0.2s'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#6366f1';
                                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.2)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#334155';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            color: '#94a3b8',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="Create a strong password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '14px 18px',
                                borderRadius: '12px',
                                background: '#0f172a',
                                border: '1px solid #334155',
                                color: 'white',
                                outline: 'none',
                                fontSize: '1rem',
                                boxSizing: 'border-box',
                                transition: 'border-color 0.2s, box-shadow 0.2s'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#6366f1';
                                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.2)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#334155';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !!successMessage}
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            color: 'white',
                            border: 'none',
                            fontSize: '1.05rem',
                            fontWeight: '700',
                            cursor: (isLoading || successMessage) ? 'not-allowed' : 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s, opacity 0.2s',
                            boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.4)',
                            opacity: (isLoading || successMessage) ? 0.7 : 1,
                            marginTop: '10px'
                        }}
                        onMouseOver={(e) => {
                            if (!isLoading && !successMessage) e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseOut={(e) => {
                            if (!isLoading && !successMessage) e.target.style.transform = 'translateY(0)';
                        }}
                    >
                        {isLoading ? 'Creating Account...' : 'Register'}
                    </button>
                </form>

                <div style={{
                    textAlign: 'center',
                    marginTop: '10px',
                    fontSize: '0.95rem',
                    color: '#94a3b8'
                }}>
                    Already have an account?{' '}
                    <Link
                        to="/login"
                        style={{
                            color: '#a5b4fc',
                            textDecoration: 'none',
                            fontWeight: '600',
                            transition: 'color 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.color = '#c7d2fe'}
                        onMouseOut={(e) => e.target.style.color = '#a5b4fc'}
                    >
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;

