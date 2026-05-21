import axios from 'axios';
import { useAppStore } from '../store/appStore';

const client = axios.create({
  baseURL: '/api',
});

client.interceptors.request.use((config) => {
  const token = useAppStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
