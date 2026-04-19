import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
      window.location.href = '/register';
    }
    return Promise.reject(error);
  }
);

// Health check
export const healthCheck = () => apiClient.get('/health');

// User endpoints
export const registerUser = (userData) => apiClient.post('/users/register', userData);
export const loginUser = (credentials) => apiClient.post('/users/login', credentials);
export const getUserProfile = (userId) => apiClient.get(`/users/${userId}`);

// Check-in endpoints
export const submitDailyCheckin = (data) => apiClient.post('/checkin/daily', data);
export const getCheckinHistory = (userId) => apiClient.get(`/checkin/history/${userId}`);

// Prediction endpoints
export const predictDiabetes = (userId) => apiClient.post('/predict/diabetes', { user_id: userId });
export const getPredictionHistory = (userId) => apiClient.get(`/predict/history/${userId}`);

// Recommendations endpoint
export const getRecommendations = (userId) => apiClient.get(`/recommendations/${userId}`);

// DFU scan endpoint
export const uploadDFUScan = (userId, imageFile) => {
  const formData = new FormData();
  formData.append('user_id', userId);
  formData.append('file', imageFile);
  return apiClient.post('/dfu/scan', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// Insole reading endpoint
export const submitInsoleReading = (data) => apiClient.post('/insole/reading', data);

export default apiClient;
