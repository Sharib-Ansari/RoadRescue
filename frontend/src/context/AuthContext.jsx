import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { storage, STORAGE_KEYS } from '../utils/storage';
import authApi from '../utils/api';

const DEMO_CREDENTIALS = {
  email: 'demo@roadrescue.in',
  password: 'demo123',
  user: {
    id: 'usr_demo',
    name: 'Arjun Sharma',
    email: 'demo@roadrescue.in',
    phone: '+91 98765 43210',
    accountType: 'customer',
    role: 'customer',
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
    role: 'mechanic',
    workshopName: 'Kumar Auto Care & Recovery',
    experience: 12,
    serviceArea: 'Sector 14, Gurgaon / Delhi NCR',
    services: ['Engine Repair', 'Tyre Service', 'Battery Jumpstart', 'Brake Service', 'Vehicle Towing'],
    joinDate: '2024-01-01'
  }
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and verify authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      // 1. Immediately hydrate from localStorage for instantaneous UI rendering
      const savedUser = storage.get(STORAGE_KEYS.USER);
      if (savedUser) {
        setUser(savedUser);
      }

      // 2. Verify and refresh session with real backend via HttpOnly cookie
      try {
        const response = await authApi.getMe();
        if (response?.success && response?.user) {
          const verifiedUser = {
            ...response.user,
            accountType: response.user.role // Ensure frontend compatibility
          };
          storage.set(STORAGE_KEYS.USER, verifiedUser);
          setUser(verifiedUser);
        }
      } catch (err) {
        // If server returns 401 Unauthorized, the session has expired or cookie is cleared
        if (err.status === 401) {
          storage.remove(STORAGE_KEYS.USER);
          setUser(null);
        }
        // If it's a network/offline error, preserve the local cached session
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Log in user using real backend API with fallback
   */
  const login = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();

    try {
      // 1. Real Backend Authentication via POST /api/auth/login
      const response = await authApi.login(cleanEmail, password);

      if (response?.success && response?.user) {
        const authenticatedUser = {
          ...response.user,
          accountType: response.user.role
        };
        storage.set(STORAGE_KEYS.USER, authenticatedUser);
        setUser(authenticatedUser);
        return { success: true, user: authenticatedUser };
      }
    } catch (err) {
      // If error is an explicit 401/400/403/429 from the server, return server message
      if (err.status) {
        return {
          success: false,
          error: err.message || 'Invalid email or password.'
        };
      }

      // 2. Offline / Demo Fallback (if backend is not running)
      console.warn('Backend unavailable, falling back to local demo auth:', err.message);

      if (cleanEmail === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
        const userData = DEMO_CREDENTIALS.user;
        storage.set(STORAGE_KEYS.USER, userData);
        setUser(userData);
        return { success: true, user: userData };
      }

      if (cleanEmail === DEMO_CREDENTIALS.mechanicEmail && password === DEMO_CREDENTIALS.mechanicPassword) {
        const userData = DEMO_CREDENTIALS.mechanicUser;
        storage.set(STORAGE_KEYS.USER, userData);
        setUser(userData);
        return { success: true, user: userData };
      }

      const registeredUsers = storage.get('roadrescue_registered_users') || [];
      const foundUser = registeredUsers.find(
        (u) => u.email.toLowerCase() === cleanEmail && u.password === password
      );
      if (foundUser) {
        const { password: _, ...userWithoutPass } = foundUser;
        storage.set(STORAGE_KEYS.USER, userWithoutPass);
        setUser(userWithoutPass);
        return { success: true, user: userWithoutPass };
      }

      return {
        success: false,
        error: err.message || 'Unable to connect to authentication server.'
      };
    }

    return { success: false, error: 'Authentication failed. Please try again.' };
  };

  /**
   * Register new customer or mechanic using real backend API
   */
  const register = async (userData) => {
    const role = (userData.role || userData.accountType || 'customer').toLowerCase();

    // Prepare harmonized payload
    const payload = {
      fullName: userData.fullName || userData.name,
      name: userData.fullName || userData.name,
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
      role: role,
      accountType: role,
      workshopName: userData.workshopName,
      servicesOffered: userData.servicesOffered || userData.services,
      experienceYears: userData.experienceYears !== undefined ? Number(userData.experienceYears) : undefined,
      serviceArea: userData.serviceArea,
      // Shop owner specific fields
      shopName: userData.shopName,
      shopAddress: userData.shopAddress || userData.address,
      shopCity: userData.shopCity || userData.city,
      shopPinCode: userData.shopPinCode || userData.pinCode,
      shopDescription: userData.shopDescription || userData.description,
      shopPhone: userData.shopPhone || userData.phone,
      latitude: userData.latitude,
      longitude: userData.longitude,
      location: userData.location,
      acceptsHomeDelivery: userData.acceptsHomeDelivery,
      acceptsShopPickup: userData.acceptsShopPickup,
      deliveryCharge: userData.deliveryCharge
    };

    try {
      // 1. Real Backend Registration via POST /api/auth/register
      const response = await authApi.register(payload);

      if (response?.success && response?.user) {
        const registeredUser = {
          ...response.user,
          accountType: response.user.role
        };
        storage.set(STORAGE_KEYS.USER, registeredUser);
        setUser(registeredUser);
        return { success: true, user: registeredUser };
      }
    } catch (err) {
      // If error is from server (e.g. 409 Duplicate Email or 400 Validation)
      if (err.status) {
        throw new Error(err.message || 'Registration failed.');
      }

      // 2. Offline / Local fallback if backend cannot be reached
      console.warn('Backend unavailable, falling back to local registration:', err.message);

      const newUser = {
        id: `usr_${Date.now()}`,
        name: payload.name || 'User',
        email: payload.email,
        phone: payload.phone,
        accountType: role,
        role: role,
        workshopName: payload.workshopName || '',
        servicesOffered: payload.servicesOffered || [],
        experienceYears: payload.experienceYears || '',
        serviceArea: payload.serviceArea || '',
        joinDate: new Date().toISOString()
      };

      const registeredUsers = storage.get('roadrescue_registered_users') || [];
      registeredUsers.push({ ...newUser, password: userData.password });
      storage.set('roadrescue_registered_users', registeredUsers);

      storage.set(STORAGE_KEYS.USER, newUser);
      setUser(newUser);
      return { success: true, user: newUser };
    }

    throw new Error('Registration failed. Please try again.');
  };

  /**
   * Log out user from both server (clearing HttpOnly cookie) and client.
   * Guard prevents duplicate requests if the button is clicked rapidly.
   */
  const isLoggingOut = useRef(false);
  const logout = async () => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Server logout error (proceeding with local cleanup):', err.message);
    } finally {
      storage.remove(STORAGE_KEYS.USER);
      setUser(null);
      isLoggingOut.current = false;
    }
  };

  /**
   * Update profile information in MongoDB and local storage
   */
  const updateUser = async (updates) => {
    try {
      const response = await authApi.updateProfile(updates);
      if (response?.success && response.user) {
        const syncedUser = {
          ...response.user,
          accountType: response.user.role
        };
        storage.set(STORAGE_KEYS.USER, syncedUser);
        setUser(syncedUser);
        return { success: true, user: syncedUser };
      }
    } catch (err) {
      console.warn('Backend profile update failed, applying locally:', err.message);
    }

    const updatedUser = { ...user, ...updates };
    storage.set(STORAGE_KEYS.USER, updatedUser);
    setUser(updatedUser);
    return { success: true, user: updatedUser };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        DEMO_CREDENTIALS
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
