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
    // Only redirect if it's a 401 and NOT from the login route
    if (error.response?.status === 401 && !error.config?.url?.includes('/users/login')) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
//      window.location.href = '/register'; // Disabled so we don't violently eject users out of the UI
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
export const getFoodSwap = (targetFood) => apiClient.get(`/recommendations/swap/${targetFood}`);

// DFU scan endpoints
export const uploadDFUScan = (userId, imageFile) => {
  const formData = new FormData();
  formData.append('file', imageFile);
  return apiClient.post(`/dfu/scan?user_id=${userId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getDFUScanHistory = (userId) => apiClient.get(`/dfu/history/${userId}`);

export const getDFUScanDetails = (scanId) => apiClient.get(`/dfu/scan/${scanId}`);

// Insole reading endpoint
export const submitInsoleReading = (data) => apiClient.post('/insole/reading', data);

export default apiClient;
