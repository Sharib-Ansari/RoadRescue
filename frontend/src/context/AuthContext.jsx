import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { storage, STORAGE_KEYS } from '../utils/storage';
import authApi from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and verify authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      // 1. Hydrate from localStorage immediately for fast UI rendering
      const savedUser = storage.get(STORAGE_KEYS.USER);
      if (savedUser) {
        setUser(savedUser);
      }

      // 2. Verify session with backend — use a shorter timeout here (20s) so the
      //    login page renders quickly even when the backend is cold-sleeping.
      //    If the backend is unreachable, we keep the cached user (or null) and
      //    let the user log in manually.
      try {
        const response = await authApi.getMe({ timeoutMs: 20_000 });
        if (response?.success && response?.user) {
          const verifiedUser = {
            ...response.user,
            accountType: response.user.role // Ensure frontend compatibility
          };
          storage.set(STORAGE_KEYS.USER, verifiedUser);
          setUser(verifiedUser);
        }
      } catch (err) {
        // 401 = session expired/no cookie → clear cached user
        if (err.status === 401) {
          storage.remove(STORAGE_KEYS.USER);
          setUser(null);
        }
        // Timeout or network error (backend cold) → keep cached state, don't block UI
        // The user can still log in normally; subsequent requests will wake the server.
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Log in user using real backend API (no fake offline credentials)
   */
  const login = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();

    try {
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

      return {
        success: false,
        error: response?.message || 'Login failed. Please check your credentials.'
      };
    } catch (err) {
      // Clear, honest server/connection error - no fake offline sessions
      return {
        success: false,
        error: err.message || 'Unable to connect to RoadRescue server. Please check your internet connection.'
      };
    }
  };

  /**
   * Register new user using real backend API (no fake offline registration)
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

      throw new Error(response?.message || 'Registration failed.');
    } catch (err) {
      throw new Error(err.message || 'Unable to connect to server. Please check your connection and try again.');
    }
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
      console.warn('Backend profile update failed:', err.message);
      throw err;
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
        updateUser
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
