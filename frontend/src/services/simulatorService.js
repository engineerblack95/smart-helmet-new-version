// ==================================================
// Simulator Service — Admin-only test API
// ==================================================

import { api } from './api.js';

export const simulatorService = {
  async send(payload) {
    const { data } = await api.post('/simulator/send', payload);
    return data.data;
  },
};