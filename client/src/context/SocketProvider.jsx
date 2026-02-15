import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { apiSlice } from '../app/api';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const dispatch = useDispatch();
    const { token, user } = useSelector((state) => state.auth);

    useEffect(() => {
        if (token && !socket) {
            // Establish connection
            const newSocket = io(import.meta.env.VITE_API_URL || 'https://autopost-server-8yze.onrender.com', {
                withCredentials: true,
            });

            newSocket.on('connect', () => {
                console.log('[Socket] Connected');
            });

            newSocket.on('disconnect', () => {
                console.log('[Socket] Disconnected');
            });

            // Listen for Events
            newSocket.on('post.published', (data) => {
                console.log('[Socket] Post Published:', data);
                // Invalidate RTK Query cache to refresh lists
                dispatch(apiSlice.util.invalidateTags(['ScheduledPost', 'DashboardStats']));
                toast.success('Post Published Successfully!', {
                    description: `Your post to ${data.platform} is now live.`
                });
            });

            newSocket.on('post.failed', (data) => {
                console.log('[Socket] Post Failed:', data);
                dispatch(apiSlice.util.invalidateTags(['ScheduledPost', 'DashboardStats']));
                toast.error('Post Failed', {
                    description: `A scheduled post failed: ${data.error}`
                });
            });

            newSocket.on('social.account.expired', (data) => {
                console.log('[Socket] Account Expired:', data);
                dispatch(apiSlice.util.invalidateTags(['SocialAccount']));
                toast.warning('Account Disconnected', {
                    description: `Please reconnect your ${data.platform} account.`
                });
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        } else if (!token && socket) {
            // Cleanup on logout
            socket.disconnect();
            setSocket(null);
        }
    }, [token, dispatch]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    return useContext(SocketContext);
};
