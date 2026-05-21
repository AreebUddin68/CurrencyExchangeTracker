import API from './axios';

export const convertSingle = (data) => API.post('/api/convert/single', data);
export const convertMultiple = (data) => API.post('/api/convert/multi', data);
export const getMyHistory = () => API.get('/api/convert/history');
export const getAllHistory = () => API.get('/api/convert/history/all');

export const saveFavoritePair = (data) => API.post('/api/convert/favorites', data);
export const getFavoritePairs = () => API.get('/api/convert/favorites');
export const exportMyHistoryCsv = () =>
  API.get('/api/convert/history/export', { responseType: 'blob' });
