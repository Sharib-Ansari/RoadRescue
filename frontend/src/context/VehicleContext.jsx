import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { generateId } from '../utils/helpers';
import authApi from '../utils/api';
import { useAuth } from './AuthContext';

const VehicleContext = createContext(null);

const DEFAULT_VEHICLES = [
  {
    id: 'veh_01',
    type: 'Car',
    brand: 'Honda',
    make: 'Honda',
    model: 'City',
    registrationNumber: 'MH 02 CZ 4421',
    fuelType: 'Petrol',
    year: 2021,
    createdAt: new Date('2023-01-15').toISOString()
  },
  {
    id: 'veh_02',
    type: 'Motorcycle/Bike',
    brand: 'Royal Enfield',
    make: 'Royal Enfield',
    model: 'Classic 350',
    registrationNumber: 'MH 01 AB 1234',
    fuelType: 'Petrol',
    year: 2022,
    createdAt: new Date('2023-04-10').toISOString()
  }
];

export const VehicleProvider = ({ children }) => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState(() => {
    const stored = storage.get(STORAGE_KEYS.VEHICLES);
    return stored && Array.isArray(stored) && stored.length > 0 ? stored : DEFAULT_VEHICLES;
  });

  const [selectedVehicle, setSelectedVehicle] = useState(() => {
    const storedSelected = storage.get(STORAGE_KEYS.SELECTED_VEHICLE);
    if (storedSelected && vehicles.some(v => (v.id === storedSelected.id || v._id === storedSelected.id))) {
      return storedSelected;
    }
    return vehicles[0] || null;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Fetch real vehicles from MongoDB when user is logged in
  const fetchVehicles = useCallback(async () => {
    if (!user || user.role === 'mechanic') return;
    setIsLoading(true);
    try {
      const response = await authApi.getVehicles();
      if (response?.success && Array.isArray(response.vehicles)) {
        const backendVehicles = response.vehicles.map(v => ({
          ...v,
          id: v.id || v._id,
          make: v.brand || v.make,
          brand: v.brand || v.make
        }));

        if (backendVehicles.length > 0) {
          setVehicles(backendVehicles);
          storage.set(STORAGE_KEYS.VEHICLES, backendVehicles);

          // Update selected vehicle if not currently set or if no longer in list
          setSelectedVehicle((prev) => {
            const stillExists = prev && backendVehicles.some(v => v.id === prev.id);
            const next = stillExists ? prev : backendVehicles[0];
            storage.set(STORAGE_KEYS.SELECTED_VEHICLE, next);
            return next;
          });
        }
      }
    } catch (err) {
      console.warn('Could not fetch vehicles from server, using local cache:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Keep localStorage updated when state changes
  useEffect(() => {
    storage.set(STORAGE_KEYS.VEHICLES, vehicles);
  }, [vehicles]);

  useEffect(() => {
    storage.set(STORAGE_KEYS.SELECTED_VEHICLE, selectedVehicle);
  }, [selectedVehicle]);

  const selectVehicle = (vehicleOrId) => {
    if (!vehicleOrId) {
      setSelectedVehicle(null);
      return;
    }
    const target = typeof vehicleOrId === 'string'
      ? vehicles.find(v => v.id === vehicleOrId || v._id === vehicleOrId)
      : vehicleOrId;
    
    if (target) {
      setSelectedVehicle(target);
    }
  };

  const addVehicle = async (vehicleData) => {
    const brandName = vehicleData.brand || vehicleData.make || 'Vehicle';
    
    // 1. Try real API persistence in MongoDB
    try {
      const response = await authApi.addVehicle({
        ...vehicleData,
        brand: brandName
      });

      if (response?.success && response.vehicle) {
        const saved = {
          ...response.vehicle,
          id: response.vehicle.id || response.vehicle._id,
          make: response.vehicle.brand,
          brand: response.vehicle.brand
        };
        const updated = [saved, ...vehicles.filter(v => v.id !== 'veh_01' && v.id !== 'veh_02')];
        setVehicles(updated);
        storage.set(STORAGE_KEYS.VEHICLES, updated);

        if (!selectedVehicle || vehicles.length === 0) {
          setSelectedVehicle(saved);
          storage.set(STORAGE_KEYS.SELECTED_VEHICLE, saved);
        }
        return saved;
      }
    } catch (err) {
      console.warn('Failed to add vehicle via API, falling back to local storage:', err.message);
    }

    // Fallback local addition if offline
    const newVehicle = {
      id: generateId(),
      ...vehicleData,
      brand: brandName,
      make: brandName,
      createdAt: new Date().toISOString()
    };
    const updated = [newVehicle, ...vehicles];
    setVehicles(updated);
    storage.set(STORAGE_KEYS.VEHICLES, updated);

    if (!selectedVehicle || vehicles.length === 0) {
      setSelectedVehicle(newVehicle);
      storage.set(STORAGE_KEYS.SELECTED_VEHICLE, newVehicle);
    }
    return newVehicle;
  };

  const editVehicle = async (vehicleId, updatedData) => {
    const brandName = updatedData.brand || updatedData.make;
    
    // 1. Try real API update in MongoDB
    try {
      if (!vehicleId.startsWith('veh_')) {
        await authApi.updateVehicle(vehicleId, {
          ...updatedData,
          brand: brandName
        });
      }
    } catch (err) {
      console.warn('Failed to update vehicle via API, updating local cache:', err.message);
    }

    const updated = vehicles.map(v => (v.id === vehicleId ? { ...v, ...updatedData, brand: brandName || v.brand, make: brandName || v.make } : v));
    setVehicles(updated);
    storage.set(STORAGE_KEYS.VEHICLES, updated);

    if (selectedVehicle && selectedVehicle.id === vehicleId) {
      const updatedSelected = { ...selectedVehicle, ...updatedData };
      setSelectedVehicle(updatedSelected);
      storage.set(STORAGE_KEYS.SELECTED_VEHICLE, updatedSelected);
    }
  };

  const deleteVehicle = async (vehicleId) => {
    // 1. Try real API deletion in MongoDB
    try {
      if (!vehicleId.startsWith('veh_')) {
        await authApi.deleteVehicle(vehicleId);
      }
    } catch (err) {
      console.warn('Failed to delete vehicle via API, updating local cache:', err.message);
    }

    const updated = vehicles.filter(v => v.id !== vehicleId);
    setVehicles(updated);
    storage.set(STORAGE_KEYS.VEHICLES, updated);

    if (selectedVehicle && selectedVehicle.id === vehicleId) {
      const nextSelected = updated[0] || null;
      setSelectedVehicle(nextSelected);
      storage.set(STORAGE_KEYS.SELECTED_VEHICLE, nextSelected);
    }
  };

  const value = {
    vehicles,
    selectedVehicle,
    selectVehicle,
    addVehicle,
    editVehicle,
    deleteVehicle,
    isLoading,
    refreshVehicles: fetchVehicles
  };

  return (
    <VehicleContext.Provider value={value}>
      {children}
    </VehicleContext.Provider>
  );
};

export const useVehicles = () => {
  const context = useContext(VehicleContext);
  if (!context) {
    const stored = storage.get(STORAGE_KEYS.VEHICLES) || DEFAULT_VEHICLES;
    const storedSelected = storage.get(STORAGE_KEYS.SELECTED_VEHICLE) || stored[0] || null;
    return {
      vehicles: stored,
      selectedVehicle: storedSelected,
      selectVehicle: () => {},
      addVehicle: async () => {},
      editVehicle: async () => {},
      deleteVehicle: async () => {},
      isLoading: false,
      refreshVehicles: () => {}
    };
  }
  return context;
};

export default VehicleContext;
