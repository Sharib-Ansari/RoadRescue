import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage, STORAGE_KEYS } from '../utils/storage';

const DEMO_CREDENTIALS = {
  email: 'demo@roadrescue.in',
  password: 'demo123',
  user: {
    id: 'usr_demo',
    name: 'Arjun Sharma',
    email: 'demo@roadrescue.in',
    phone: '+91 98765 43210',
    accountType: 'customer',
    joinDate: '2024-01-01'
  },
  mechanicEmail: 'mechanic@roadrescue.in',
  mechanicPassword: 'mechanic123',
  mechanicUser: {
    id: 'mech_demo',
    name: 'Rajesh Kumar (Partner)',
    email: 'mechanic@roadrescue.in',
    phone: '+91 98765 12345',
    accountType: 'mechanic',
    joinDate: '2024-01-01'
  }
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = storage.get(STORAGE_KEYS.USER);
    if (savedUser) {
      setUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  const login = (email, password) => {
    // Check demo customer credentials
    if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
      const userData = DEMO_CREDENTIALS.user;
      storage.set(STORAGE_KEYS.USER, userData);
      setUser(userData);
      return { success: true, user: userData };
    }

    // Check demo mechanic credentials
    if (email === DEMO_CREDENTIALS.mechanicEmail && password === DEMO_CREDENTIALS.mechanicPassword) {
      const userData = DEMO_CREDENTIALS.mechanicUser;
      storage.set(STORAGE_KEYS.USER, userData);
      setUser(userData);
      return { success: true, user: userData };
    }

    // Check registered users list or last saved user
    const registeredUsers = storage.get('roadrescue_registered_users') || [];
    const foundUser = registeredUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (foundUser) {
      const { password: _, ...userWithoutPass } = foundUser;
      storage.set(STORAGE_KEYS.USER, userWithoutPass);
      setUser(userWithoutPass);
      return { success: true, user: userWithoutPass };
    }

    const savedUser = storage.get(STORAGE_KEYS.USER);
    if (savedUser && savedUser.email && savedUser.email.toLowerCase() === email.toLowerCase()) {
      setUser(savedUser);
      return { success: true, user: savedUser };
    }

    return { 
      success: false, 
      error: 'Invalid credentials. Use demo customer (demo@roadrescue.in / demo123) or mechanic (mechanic@roadrescue.in / mechanic123).' 
    };
  };

  const register = (userData) => {
    const role = (userData.role || userData.accountType || 'customer').toLowerCase();
    const newUser = {
      id: `usr_${Date.now()}`,
      name: userData.name || userData.fullName || 'User',
      email: userData.email,
      phone: userData.phone,
      accountType: role,
      role: role,
      // Mechanic specific profile fields
      workshopName: userData.workshopName || '',
      servicesOffered: userData.servicesOffered || [],
      experienceYears: userData.experienceYears || '',
      serviceArea: userData.serviceArea || '',
      joinDate: new Date().toISOString()
    };

    // Also persist into registered users list for subsequent logins
    const registeredUsers = storage.get('roadrescue_registered_users') || [];
    registeredUsers.push({ ...newUser, password: userData.password });
    storage.set('roadrescue_registered_users', registeredUsers);

    storage.set(STORAGE_KEYS.USER, newUser);
    setUser(newUser);
    return { success: true, user: newUser };
  };

  const logout = () => {
    storage.remove(STORAGE_KEYS.USER);
    setUser(null);
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    storage.set(STORAGE_KEYS.USER, updatedUser);
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser, DEMO_CREDENTIALS }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
