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
  /**
   * Register a customer or mechanic
   */
  register: (userData) => request('/auth/register', {
    method: 'POST',
    body: userData
  }),

  /**
   * Log in user with email and password
   */
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: { email, password }
  }),

  /**
   * Get current authenticated user profile using HttpOnly cookie
   */
  getMe: () => request('/auth/me', {
    method: 'GET'
  }),

  /**
   * Log out and clear authentication cookie
   */
  logout: () => request('/auth/logout', {
    method: 'POST'
  }),

  /**
   * Check backend health and MongoDB Atlas status
   */
  checkHealth: () => request('/health', {
    method: 'GET'
  }),

  /**
   * Customer dashboard data
   */
  getCustomerDashboard: () => request('/customer/dashboard', {
    method: 'GET'
  }),

  /**
   * Mechanic dashboard data
   */
  getMechanicDashboard: () => request('/mechanic/dashboard', {
    method: 'GET'
  })
};

export default authApi;
