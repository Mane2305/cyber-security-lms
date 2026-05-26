import axios from 'axios';
import { auth } from '../firebase/auth';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});

axiosInstance.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    localStorage.setItem('cs_token', token);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
