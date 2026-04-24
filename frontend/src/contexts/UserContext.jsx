import React, { createContext, useState, useContext, useEffect } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      const savedUserId = localStorage.getItem('user_id');
      if (savedUser && savedUserId) {
        return JSON.parse(savedUser);
      }
    } catch (e) {
      console.error('Failed to parse saved user:', e);
      localStorage.removeItem('user');
      localStorage.removeItem('user_id');
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkinDays, setCheckinDays] = useState(0);
  const [predictions, setPredictions] = useState([]);

  // Note: Removed the empty useEffect doing the same parsing, mapped default state above to prevent ProtectedRoute flashes

  const registerUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('user_id', userData.user_id);
  };

  const logout = () => {
    setUser(null);
    setCheckinDays(0);
    setPredictions([]);
    localStorage.removeItem('user');
    localStorage.removeItem('user_id');
    localStorage.removeItem('auth_token');
  };

  const updateCheckinDays = (days) => {
    setCheckinDays(days);
  };

  const updatePredictions = (newPredictions) => {
    setPredictions(newPredictions);
  };

  const value = {
    user,
    setUser,
    registerUser,
    logout,
    loading,
    setLoading,
    error,
    setError,
    checkinDays,
    updateCheckinDays,
    predictions,
    updatePredictions,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
