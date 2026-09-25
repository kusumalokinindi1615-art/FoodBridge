import { io } from 'socket.io-client';
import { getToken } from './api';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket = null;

/** Connect using the stored JWT; the server joins the authenticated user's room. */
export const connectSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token: getToken() },
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
