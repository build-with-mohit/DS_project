import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Standard error extractor for user-facing toasts
 */
export const extractErrorMessage = (error, defaultMsg = 'An unexpected error occurred.') => {
  if (error.response) {
    if (error.response.data && error.response.data.detail) {
      if (typeof error.response.data.detail === 'string') {
        return error.response.data.detail;
      }
      if (Array.isArray(error.response.data.detail)) {
        return error.response.data.detail.map(d => d.msg || d.message).join(', ');
      }
    }
    if (error.response.data && error.response.data.message) {
      return error.response.data.message;
    }
  }
  return error.message || defaultMsg;
};

// API Services
export const api = {
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
  getExportCsvUrl: () => `${API_BASE_URL}/api/books/export`,

  // System Reset
  resetDatabase: async () => {
    const response = await apiClient.post('/api/system/reset');
    return response.data;
  },
};

export default api;
