import api from './api';

export const kardexService = {
  getProductKardex: (productId) => api.get(`/kardex/${productId}`),
  addMovement: (productId, data) => api.post(`/kardex/${productId}`, data)
};
