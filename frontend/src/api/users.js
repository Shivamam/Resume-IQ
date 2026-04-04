import api from './axios';

export const getMe = () => api.get('/users/me');

export const updatePassword = (data) => api.post('/auth/change-password', data);
