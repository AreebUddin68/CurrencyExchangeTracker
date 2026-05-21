import API from './axios';
export const getRecentLogs    = ()   => API.get('/api/audit/logs');
export const getTrace         = (id) => API.get(`/api/audit/trace/${id}`);
export const getMonitorSummary= ()   => API.get('/api/audit/monitor');
export const getErrors        = ()   => API.get('/api/audit/errors');
