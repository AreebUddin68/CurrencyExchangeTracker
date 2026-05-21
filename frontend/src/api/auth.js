import API from './axios';
export const loginUser    = (data) => API.post('/api/auth/login', data);
export const registerUser = (data) => API.post('/api/auth/register', data);
export const getMe        = ()     => API.get('/api/auth/me');
export const getAllUsers   = ()     => API.get('/api/auth/users');
