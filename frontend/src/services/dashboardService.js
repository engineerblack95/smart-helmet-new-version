import { api } from './api.js';

export const dashboardService = {
  async overview() {
    const { data } = await api.get('/dashboard/overview');
    return data.data;
  },
  async violationTrends(days = 7) {
    const { data } = await api.get('/dashboard/violations/trends', { params: { days } });
    return data.data;
  },
};