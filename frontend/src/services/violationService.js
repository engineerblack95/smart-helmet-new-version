import { api } from './api.js';

export const violationService = {
  async list(params = {}) {
    const { data } = await api.get('/violations', { params });
    return data.data;
  },
  async stats() {
    const { data } = await api.get('/violations/stats');
    return data.data;
  },
  async get(id) {
    const { data } = await api.get(`/violations/${id}`);
    return data.data;
  },
  async resolve(id) {
    const { data } = await api.put(`/violations/${id}/resolve`);
    return data.data;
  },
};