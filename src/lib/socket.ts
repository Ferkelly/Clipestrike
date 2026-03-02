import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
    if (!socket) {
        const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        socket = io(socketUrl, { path: '/socket.io', transports: ['websocket', 'polling'] });
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
