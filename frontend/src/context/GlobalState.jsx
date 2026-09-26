import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { authAPI, donationsAPI, notificationsAPI, setToken, getToken } from '../api/api';
import { connectSocket, disconnectSocket, getSocket } from '../api/socket';

const GlobalContext = createContext();

export const useGlobalState = () => useContext(GlobalContext);

export const GlobalProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [donations, setDonations] = useState([]);
  const [notifications, setNotifications] = useState([]);

  /* ─── Helpers ─────────────────────────────────────── */
  const refreshDonations = useCallback(async () => {
    try {
      const data = await donationsAPI.list();
      setDonations(data.donations || []);
    } catch (err) {
      console.error('Failed to load donations:', err?.message);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!getToken()) return;
    try {
      const data = await notificationsAPI.list();
      // Map Mongo docs to the shape the UI expects ({ id, date, text, ... })
      setNotifications((data.notifications || []).map(n => ({ ...n, id: n._id, date: n.createdAt })));
    } catch (err) {
      console.error('Failed to load notifications:', err?.message);
    }
  }, []);

  /* ─── Boot: restore session + initial data ────────── */
  useEffect(() => {
    (async () => {
      if (getToken()) {
        try {
          const { user } = await authAPI.me();
          setCurrentUser(user);
          connectSocket(user.id);
          refreshNotifications();
        } catch {
          setToken(null); // stale/invalid token
        }
      }
      await refreshDonations();
      setBooting(false);
    })();
  }, [refreshDonations, refreshNotifications]);

  /* ─── Real-time listeners (Socket.IO) ─────────────── */
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNotification = (notif) => {
      setNotifications((prev) => [{ ...notif, id: notif._id, date: notif.createdAt }, ...prev]);
      // Notifications can reference a donation the list doesn't have yet
      // (e.g. a request just shared with this volunteer) — fetch it right away.
      if (notif?.donationId) refreshDonations();
    };
    const onDonationUpdated = () => refreshDonations();

    socket.on('notification', onNotification);
    socket.on('donationUpdated', onDonationUpdated);
    return () => {
      socket.off('notification', onNotification);
      socket.off('donationUpdated', onDonationUpdated);
    };
  }, [currentUser, refreshDonations]);

  /* ─── Auth actions ────────────────────────────────── */
  const login = async (email, password) => {
    const { token, user } = await authAPI.login(email, password);
    setToken(token);
    setCurrentUser(user);
    connectSocket(user.id);
    refreshNotifications();
    refreshDonations(); // role-scoped list must load right after login, not only on F5
    return user;
  };

  const logout = () => {
    setToken(null);
    disconnectSocket();
    setCurrentUser(null);
    setNotifications([]);
  };

  const registerUser = async (userData) => {
    // Create the account only — do NOT auto-login. User is redirected to /login.
    const { user } = await authAPI.register(userData);
    return user;
  };

  /* ─── Donation actions ────────────────────────────── */
  const addDonation = async (donationData) => {
    const payload = {
      ...donationData,
      lat: donationData.coords?.latitude,
      lng: donationData.coords?.longitude,
    };
    const { donation } = await donationsAPI.create(payload);
    await refreshDonations();
    return donation;
  };

  const updateDonationStatus = async (id, newStatus, additionalData = {}) => {
    const { donation } = await donationsAPI.updateStatus(id, newStatus, additionalData);
    await refreshDonations(); // server emits 'donationUpdated' too; this keeps us snappy
    return donation;
  };

  /* ─── Notifications ───────────────────────────────── */
  const markNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await notificationsAPI.markAllRead();
    } catch { /* non-fatal */ }
  };

  return (
    <GlobalContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        booting,
        login,
        logout,
        registerUser,
        donations,
        refreshDonations,
        addDonation,
        updateDonationStatus,
        notifications,
        refreshNotifications,
        markNotificationsRead,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};
