import axios from 'axios';

/**
 * Normalizes a base URL:
 * - Strips trailing slashes
 * - Strips any accidental '/api' suffix so endpoint paths (/api/...) do not duplicate
 */
export const normalizeBaseUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let trimmed = rawUrl.trim();
  // Strip trailing slashes
  trimmed = trimmed.replace(/\/+$/, '');
  // Strip trailing '/api' to avoid duplicating /api/api/...
  if (trimmed.endsWith('/api')) {
    trimmed = trimmed.slice(0, -4);
  }
  return trimmed;
};

/**
 * Resolves the backend base URL:
 * - In production: uses import.meta.env.VITE_API_URL.
 *   NEVER falls back to localhost or 127.0.0.1 in production to prevent Mixed Content
 *   or ERR_CONNECTION_REFUSED errors in deployed environments.
 * - In local development: uses VITE_API_URL if explicitly provided,
 *   otherwise defaults to empty string "" which allows Vite's dev proxy (/api)
 *   to automatically forward requests to http://127.0.0.1:8000.
 */
export const resolveBaseUrl = () => {
  const configured = import.meta.env.VITE_API_URL;
  if (configured && typeof configured === 'string' && configured.trim() !== '') {
    return normalizeBaseUrl(configured);
  }

  if (import.meta.env.DEV) {
    // In local Vite development, an empty string routes via Vite's proxy configured in vite.config.js
    return '';
  }

  // In production with no VITE_API_URL set:
  // Fall back to empty string (same-origin) and output a diagnostic warning.
  if (typeof console !== 'undefined' && console.warn) {
    console.warn(
      '[LIBRIX API] VITE_API_URL is not set in environment variables. ' +
      'Requests will be sent to the same origin. ' +
      'For cross-domain backend deployments, configure VITE_API_URL in your Vercel Project Settings.'
    );
  }
  return '';
};

export const API_BASE_URL = resolveBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: ensure proper content-type on JSON bodies
apiClient.interceptors.request.use(
  (config) => {
    if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: ensure non-2xx responses and network failures are handled cleanly
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log network/server errors for diagnostics
    if (error.code === 'ERR_NETWORK') {
      console.error(
        '[LIBRIX API Network Error] Unable to connect to backend server at:',
        API_BASE_URL || window?.location?.origin
      );
    }
    return Promise.reject(error);
  }
);

/**
 * Standard error extractor for user-facing toasts and alerts.
 * Handles FastAPI / Pydantic validation error lists, string details, and network errors.
 */
export const extractErrorMessage = (error, defaultMsg = 'An unexpected error occurred.') => {
  if (!error) return defaultMsg;

  if (error.response) {
    const data = error.response.data;
    if (data) {
      if (typeof data.detail === 'string') {
        return data.detail;
      }
      if (Array.isArray(data.detail)) {
        return data.detail
          .map((d) => (typeof d === 'string' ? d : d.msg || d.message || JSON.stringify(d)))
          .join(', ');
      }
      if (typeof data.message === 'string') {
        return data.message;
      }
      if (typeof data === 'string') {
        return data;
      }
    }
    if (error.response.status === 404) return 'The requested resource was not found.';
    if (error.response.status === 400) return 'Invalid request data. Please check your input.';
    if (error.response.status === 409) return 'A conflict occurred with this resource.';
    if (error.response.status === 502 || error.response.status === 503 || error.response.status === 504) {
      return 'Backend service is currently unavailable or starting up. Please retry in a moment.';
    }
    if (error.response.status >= 500) return 'Internal server error. Please try again.';
    return `Server returned error (${error.response.status}).`;
  }

  if (error.request) {
    return 'Unable to reach backend API. Please check your network or VITE_API_URL configuration.';
  }

  return error.message || defaultMsg;
};

// Centralized API Service Methods
export const api = {
  // Health Check
  checkHealth: async () => {
    const response = await apiClient.get('/api/health');
    return response.data;
  },

  // Books CRUD
  getBooks: async (params = {}) => {
    const response = await apiClient.get('/api/books', { params });
    return response.data;
  },

  getBookByIsbn: async (isbn) => {
    const response = await apiClient.get(`/api/books/${encodeURIComponent(isbn)}`);
    return response.data;
  },

  addBook: async (bookData) => {
    const response = await apiClient.post('/api/books', bookData);
    return response.data;
  },

  updateBook: async (isbn, updateData) => {
    const response = await apiClient.put(`/api/books/${encodeURIComponent(isbn)}`, updateData);
    return response.data;
  },

  deleteBook: async (isbn) => {
    const response = await apiClient.delete(`/api/books/${encodeURIComponent(isbn)}`);
    return response.data;
  },

  // Search
  searchBooks: async (query, type = 'all') => {
    const response = await apiClient.get('/api/books/search', {
      params: { q: query, type },
    });
    return response.data;
  },

  // Issue & Return
  issueBook: async (isbn, studentName) => {
    const response = await apiClient.post(`/api/books/${encodeURIComponent(isbn)}/issue`, {
      student_name: studentName,
    });
    return response.data;
  },

  returnBook: async (isbn) => {
    const response = await apiClient.post(`/api/books/${encodeURIComponent(isbn)}/return`);
    return response.data;
  },

  // Analytics & Visualizer
  getDashboardStats: async () => {
    const response = await apiClient.get('/api/dashboard/stats');
    return response.data;
  },

  getLinkedListVisualization: async () => {
    const response = await apiClient.get('/api/linked-list/visualize');
    return response.data;
  },

  getReports: async () => {
    const response = await apiClient.get('/api/reports');
    return response.data;
  },

  // CSV Export URL
  getExportCsvUrl: () => {
    const base = API_BASE_URL ? API_BASE_URL.replace(/\/+$/, '') : '';
    return `${base}/api/books/export`;
  },

  // System Reset
  resetDatabase: async () => {
    const response = await apiClient.post('/api/system/reset');
    return response.data;
  },
};

export default api;
