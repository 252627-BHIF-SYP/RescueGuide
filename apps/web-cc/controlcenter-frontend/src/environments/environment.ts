const apiHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const apiProtocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';

export const environment = {
  production: false,
  apiUrl: `${apiProtocol}//${apiHost}:5001/api`,
  signalingUrl: `${apiProtocol}//${apiHost}:3000`,
};
