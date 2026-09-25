import { io } from 'socket.io-client';
import { getToken } from './api';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket = null;

/** Connect (once) and join the user's private notification room */
export const connectSocket = (userId) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token: getToken() },
      transports: ['websocket', 'polling'],
    });
  }
  if (userId) socket.emit('join', userId);
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
