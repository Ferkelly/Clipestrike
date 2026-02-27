import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '../lib/api';

const TOKEN_KEY = 'clipstrike_token';

interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
}

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Capturar token da URL (retorno do OAuth)
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get('token');
        if (urlToken) {
            localStorage.setItem(TOKEN_KEY, urlToken);
            window.history.replaceState({}, '', window.location.pathname);
        }

        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) { setLoading(false); return; }

        apiGet<{ user: User }>('/auth/me')
            .then(({ user }) => setUser(user))
            .catch(() => localStorage.removeItem(TOKEN_KEY))
            .finally(() => setLoading(false));
    }, []);

    const login = useCallback(() => {
        window.location.href = '/api/auth/google';
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        window.location.href = '/';
    }, []);

    return { user, loading, login, logout, isAuthenticated: !!user };
};
