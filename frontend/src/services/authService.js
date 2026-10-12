import { api } from './api.js';

export const authService = {
  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    return data.data;
  },

  async register(payload) {
    const { data } = await api.post('/auth/register', payload);
    return data.data;
  },

  async getProfile() {
    const { data } = await api.get('/auth/profile');
    return data.data;
  },

  async updateProfile(payload) {
    const { data } = await api.put('/auth/profile', payload);
    return data.data;
  },

  async changePassword(currentPassword, newPassword) {
    const { data } = await api.post('/auth/change-password', { currentPassword, newPassword });
    return data.data;
  },
};