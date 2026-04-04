'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: Record<number, boolean>;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, onlineUsers: {}, connected: false });

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const socketRef = useRef<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Record<number, boolean>>({});
  const [connected, setConnected] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Sync token from localStorage
  useEffect(() => {
    const check = () => {
      const t = localStorage.getItem('token');
      if (t !== token) setToken(t);
    };
    check();
    const interval = setInterval(check, 1000); // Poll token changes
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('get_online_friends');
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('online_statuses', (statuses: Record<number, boolean>) => {
      setOnlineUsers(statuses);
    });

    socket.on('friend_status_change', ({ user_id, is_online }: { user_id: number; is_online: boolean }) => {
      setOnlineUsers(prev => ({ ...prev, [user_id]: is_online }));
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onlineUsers, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);