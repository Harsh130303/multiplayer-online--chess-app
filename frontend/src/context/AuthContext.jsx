import React, { createContext, useState, useEffect } from 'react';
import client from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const login = async (username, password) => {
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const response = await client.post('/login', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newToken = response.data.access_token;
            setToken(newToken);
            localStorage.setItem('token', newToken);

            const userData = { username };
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));

            return true;
        } catch (error) {
            console.error("Login failed", error);
            return false;
        }
    };

    const register = async (username, password) => {
        try {
            await client.post('/register', { username, password });
            return true;
        } catch (error) {
            console.error("Registration failed", error);
            return false;
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ token, user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
