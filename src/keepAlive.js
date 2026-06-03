import { API } from './api';

// This runs in the background and pings the backend every 14 minutes
// to prevent Render free tier from sleeping

const keepAlive = () => {
  fetch(`${API}/`)
    .then(() => console.log('Backend kept alive'))
    .catch(() => {});
};

// Ping every 14 minutes
setInterval(keepAlive, 14 * 60 * 1000);

// Ping immediately on load
keepAlive();
