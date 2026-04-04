import api from './axios';

export const register = (data) => api.post('/auth/register', data);

export const login = (data) => api.post('/auth/login', data);

export const verifyOtp = (data) => api.post('/auth/verify-otp', data);

export const getMe = () => api.get('/users/me');
