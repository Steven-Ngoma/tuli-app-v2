const LOCAL_API = 'http://127.0.0.1:8000';
const PROD_API = 'https://tuli-backend-44vd.onrender.com';

const isLocalHost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);

export const API = process.env.REACT_APP_API_URL || (isLocalHost ? LOCAL_API : PROD_API);
