import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
    if (!socket) {
        const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
        const token = localStorage.getItem('clipstrike_token');

        socket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true
        });

        socket.on('connect', () => {
            console.log('[Socket] Conectado:', socket?.id);
        });

        socket.on('connect_error', (err) => {
            console.error('[Socket] Erro de conexão:', err.message);
        });
    }
    return socket;
};

export const useSocketEvent = (event: string, callback: (data: unknown) => void) => {
    const cbRef = useRef(callback);
    cbRef.current = callback;

    useEffect(() => {
        const s = getSocket();
        const handler = (data: unknown) => cbRef.current(data);
        s.on(event, handler);
        return () => { s.off(event, handler); };
    }, [event]);
};
