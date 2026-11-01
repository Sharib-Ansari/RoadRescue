// LocalStorage utility functions
export const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('Storage get error:', e);
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage set error:', e);
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Storage remove error:', e);
    }
  },
  clear: () => {
    try {
      localStorage.clear();
    } catch (e) {
      console.error('Storage clear error:', e);
    }
  }
};

export const STORAGE_KEYS = {
  USER: 'roadrescue_user',
  VEHICLES: 'roadrescue_vehicles',
  CART: 'roadrescue_cart',
  REQUESTS: 'roadrescue_requests',
  SELECTED_VEHICLE: 'roadrescue_selected_vehicle',
  ACTIVE_REQUEST: 'roadrescue_active_request',
  EMERGENCY_DATA: 'roadrescue_emergency_data'
};
