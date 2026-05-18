// Determine if production mode based on environment variable or default to development
const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

export const environment = {
  production: false,
  apiUrl: isProduction ? 'http://192.168.6.10:5001/api' : 'http://localhost:5238/api',
  signalingUrl: isProduction ? 'http://192.168.6.10:3000' : 'http://localhost:3000'
};
