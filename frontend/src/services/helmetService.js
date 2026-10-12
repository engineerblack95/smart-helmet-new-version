import { api } from './api.js';

export const helmetService = {
  async list(params = {}) {
    const { data } = await api.get('/helmets', { params });
    return data.data;
  },
  async stats() {
    const { data } = await api.get('/helmets/stats');
    return data.data;
  },
  async get(id) {
    const { data } = await api.get(`/helmets/${id}`);
    return data.data;
  },
  async create(payload) {
    const { data } = await api.post('/helmets', payload);
    return data.data;
  },
  async update(id, payload) {
    const { data } = await api.put(`/helmets/${id}`, payload);
    return data.data;
  },
  async remove(id) {
    const { data } = await api.delete(`/helmets/${id}`);
    return data.data;
  },
};