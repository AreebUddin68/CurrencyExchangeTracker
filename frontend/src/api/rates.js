import API from './axios';

export const getSingleRate = (c) => API.get(`/api/rates/${c}`);
export const getMultipleRates = (arr) => API.get(`/api/rates/multi?currencies=${arr.join(',')}`);
export const convertCurrency = (f, t, amt) => API.get(`/api/rates/convert?from=${f}&to=${t}&amount=${amt}`);

export const createRateAlert = (data) => API.post('/api/rates/alerts', data);
export const getMyRateAlerts = () => API.get('/api/rates/alerts');
export const deleteRateAlert = (alertId) => API.delete(`/api/rates/alerts/${alertId}`);
export const checkRateAlerts = () => API.post('/api/rates/alerts/check');

export const getAlertThreshold = () => API.get('/api/rates/alerts/threshold');
export const updateAlertThreshold = (maxAlertsPerUser) =>
  API.put('/api/rates/alerts/threshold', { maxAlertsPerUser });
