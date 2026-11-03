/**
 * RoadRescue API Client
 * Configured with credentialed requests (HttpOnly cookies) and error handling.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Core fetch wrapper with JSON serialization, cookie credentials, and structured error responses.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers,
    credentials: 'include' // Crucial for HttpOnly JWT cookies across all requests
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);

    // Try parsing JSON body
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      const errorMessage = data?.message || data?.error?.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    // If backend is completely offline or network fails
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const netError = new Error('Unable to connect to RoadRescue server. Please ensure the backend is running on port 5000.');
      netError.status = 503;
      netError.isNetworkError = true;
      throw netError;
    }
    throw err;
  }
}

export const authApi = {
  // Authentication & Session
  register: (userData) => request('/auth/register', { method: 'POST', body: userData }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  getMe: () => request('/auth/me', { method: 'GET' }),
  updateProfile: (profileData) => request('/auth/profile', { method: 'PATCH', body: profileData }),
  updateAvailability: (isOnline) => request('/auth/availability', { method: 'PATCH', body: { isOnline } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  checkHealth: () => request('/health', { method: 'GET' }),

  // Dashboards
  getCustomerDashboard: () => request('/customer/dashboard', { method: 'GET' }),
  getMechanicDashboard: () => request('/mechanic/dashboard', { method: 'GET' }),

  // Vehicles
  getVehicles: () => request('/vehicles', { method: 'GET' }),
  addVehicle: (vehicleData) => request('/vehicles', { method: 'POST', body: vehicleData }),
  updateVehicle: (id, vehicleData) => request(`/vehicles/${id}`, { method: 'PUT', body: vehicleData }),
  deleteVehicle: (id) => request(`/vehicles/${id}`, { method: 'DELETE' }),

  // Service Requests
  createRequest: (requestData) => request('/requests', { method: 'POST', body: requestData }),
  getMyRequests: () => request('/requests', { method: 'GET' }),
  getActiveRequest: () => request('/requests/active', { method: 'GET' }),
  getRequestById: (id) => request(`/requests/${id}`, { method: 'GET' }),
  updateRequestStatus: (id, status, note, finalCharge) => request(`/requests/${id}/status`, {
    method: 'PATCH',
    body: { status, note, finalCharge }
  }),

  // Mechanics
  getMechanics: (params = {}) => {
    const query = new URLSearchParams();
    if (params.service && params.service !== 'all') query.append('service', params.service);
    if (params.search) query.append('search', params.search);
    if (params.area) query.append('area', params.area);
    const qs = query.toString();
    return request(`/mechanics${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
  getMechanicById: (id) => request(`/mechanics/${id}`, { method: 'GET' })
};

export default authApi;
