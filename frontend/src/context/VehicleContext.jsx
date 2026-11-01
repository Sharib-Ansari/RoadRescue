import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { generateId } from '../utils/helpers';

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
  const [vehicles, setVehicles] = useState(() => {
    const stored = storage.get(STORAGE_KEYS.VEHICLES);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
    // Seed default vehicles if none exist
    storage.set(STORAGE_KEYS.VEHICLES, DEFAULT_VEHICLES);
    return DEFAULT_VEHICLES;
  });

  const [selectedVehicle, setSelectedVehicle] = useState(() => {
    const storedSelected = storage.get(STORAGE_KEYS.SELECTED_VEHICLE);
    if (storedSelected && vehicles.some(v => v.id === storedSelected.id)) {
      return storedSelected;
    }
    return vehicles[0] || null;
  });

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
      ? vehicles.find(v => v.id === vehicleOrId)
      : vehicleOrId;
    
    if (target) {
      setSelectedVehicle(target);
    }
  };

  const addVehicle = (vehicleData) => {
    const brandName = vehicleData.brand || vehicleData.make || 'Vehicle';
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

    // If this is the only vehicle, automatically select it
    if (!selectedVehicle || vehicles.length === 0) {
      setSelectedVehicle(newVehicle);
      storage.set(STORAGE_KEYS.SELECTED_VEHICLE, newVehicle);
    }
    return newVehicle;
  };

  const editVehicle = (vehicleId, updatedData) => {
    const updated = vehicles.map(v => (v.id === vehicleId ? { ...v, ...updatedData } : v));
    setVehicles(updated);
    storage.set(STORAGE_KEYS.VEHICLES, updated);

    if (selectedVehicle && selectedVehicle.id === vehicleId) {
      const updatedSelected = { ...selectedVehicle, ...updatedData };
      setSelectedVehicle(updatedSelected);
      storage.set(STORAGE_KEYS.SELECTED_VEHICLE, updatedSelected);
    }
  };

  const deleteVehicle = (vehicleId) => {
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
    deleteVehicle
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
    // Safe fallback if used outside provider
    const stored = storage.get(STORAGE_KEYS.VEHICLES) || DEFAULT_VEHICLES;
    const storedSelected = storage.get(STORAGE_KEYS.SELECTED_VEHICLE) || stored[0] || null;
    return {
      vehicles: stored,
      selectedVehicle: storedSelected,
      selectVehicle: () => {},
      addVehicle: () => {},
      editVehicle: () => {},
      deleteVehicle: () => {}
    };
  }
  return context;
};

export default VehicleContext;
