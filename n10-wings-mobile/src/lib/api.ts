import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production API endpoint
const API_URL = 'https://n10-wings-backend.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60s timeout to allow Render.com free tier cold starts
  headers: { 'Content-Type': 'application/json' },
});

// Add token to every request automatically
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;