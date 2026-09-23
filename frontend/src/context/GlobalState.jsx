import React, { createContext, useState, useContext } from 'react';
import { mockDonations as initialDonations, mockUsers as initialUsers, mockNotifications as initialNotifications } from '../mockData';

const GlobalContext = createContext();

export const useGlobalState = () => useContext(GlobalContext);

export const GlobalProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState(initialUsers || []);
  const [donations, setDonations] = useState(initialDonations || []);
  const [notifications, setNotifications] = useState(initialNotifications || []);

  const login = (email, role) => {
    // Mock login logic
    const user = users.find(u => u.email === email) || { id: Date.now(), name: 'Demo User', email, role };
    setCurrentUser(user);
    return user;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const registerUser = (userData) => {
    const newUser = { id: Date.now(), ...userData };
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    return newUser;
  };

  const addDonation = (donationData) => {
    const newDonation = {
      id: Date.now(),
      ...donationData,
      status: 'AVAILABLE',
      donorId: currentUser?.id,
      createdAt: new Date().toISOString()
    };
    setDonations([...donations, newDonation]);
    
    // Simulate notification to NGOs
    addNotification({
      userId: 'NGO_ALL', // Mock broadcast
      text: `New food donation available nearby: ${donationData.title}`,
      donationId: newDonation.id,
      type: 'NEW_DONATION'
    });
  };

  const updateDonationStatus = (id, newStatus, additionalData = {}) => {
    setDonations(donations.map(d => {
      if (d.id === id) {
        const updated = { ...d, status: newStatus, ...additionalData };
        
        // Handle notifications based on status changes
        if (newStatus === 'NGO_ACCEPTED') {
          addNotification({ userId: updated.donorId, text: `Your donation "${updated.title}" was accepted by an NGO!`, type: 'ACCEPTED' });
        } else if (newStatus === 'DELIVERED') {
          addNotification({ userId: updated.donorId, text: `Your donation "${updated.title}" has been delivered successfully!`, type: 'DELIVERED' });
          addNotification({ userId: updated.ngoId, text: `Food delivery for "${updated.title}" has arrived!`, type: 'DELIVERED' });
        }
        
        return updated;
      }
      return d;
    }));
  };

  const addNotification = (notif) => {
    setNotifications([{ id: Date.now(), read: false, date: new Date().toISOString(), ...notif }, ...notifications]);
  };

  const markNotificationsRead = (userId) => {
    setNotifications(notifications.map(n => n.userId === userId || n.userId === 'NGO_ALL' ? { ...n, read: true } : n));
  };

  return (
    <GlobalContext.Provider value={{
      currentUser, login, logout, registerUser,
      users,
      donations, addDonation, updateDonationStatus,
      notifications, markNotificationsRead
    }}>
      {children}
    </GlobalContext.Provider>
  );
};
