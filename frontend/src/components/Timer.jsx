import React, { useState, useEffect } from 'react';

const Timer = ({ time, isActive, label, onTimeout }) => {
    const [seconds, setSeconds] = useState(time);

    // Sync with server time whenever it changes
    useEffect(() => {
        setSeconds(time);
    }, [time]);

    useEffect(() => {
        let interval = null;
        if (isActive && seconds > 0) {
            interval = setInterval(() => {
                setSeconds((prev) => {
                    const next = Math.max(0, prev - 1);
                    if (next === 0 && onTimeout) onTimeout();
                    return next;
                });
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isActive, seconds, onTimeout]);

    const formatTime = (s) => {
        if (s === null || s === undefined) return "--:--";
        const mins = Math.floor(s / 60);
        const secs = Math.floor(s % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const isLowTime = seconds < 30;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: isActive ? '#334155' : 'rgba(30, 41, 59, 0.3)',
            padding: '10px 20px',
            borderRadius: '12px',
            border: `2px solid ${isActive ? '#6366f1' : 'transparent'}`,
            transition: 'all 0.3s ease',
            minWidth: '120px',
            boxShadow: isActive ? '0 0 15px rgba(99, 102, 241, 0.3)' : 'none'
        }}>
            <span style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                fontFamily: 'monospace',
                color: isLowTime && isActive ? '#ef4444' : 'white'
            }}>
                {formatTime(seconds)}
            </span>
        </div>
    );
};

export default Timer;
