import { api } from './api.js';

export const bikeService = {
  async list(params = {}) {
    const { data } = await api.get('/bikes', { params });
    return data.data;
  },
  async stats() {
    const { data } = await api.get('/bikes/stats');
    return data.data;
  },
  async get(id) {
    const { data } = await api.get(`/bikes/${id}`);
    return data.data;
  },
  async create(payload) {
    const { data } = await api.post('/bikes', payload);
    return data.data;
  },
  async update(id, payload) {
    const { data } = await api.put(`/bikes/${id}`, payload);
    return data.data;
  },
  async remove(id) {
    const { data } = await api.delete(`/bikes/${id}`);
    return data.data;
  },
};