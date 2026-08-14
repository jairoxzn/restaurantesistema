import api from './api';

export const publicService = {
  getCategories: () => api.get('/categories/public'),
  getProducts: () => api.get('/products/public'),
};
