# TULI Delivery System

A comprehensive delivery platform optimized for Lusaka, Zambia with real-time maps, driver tracking, and landmark-based addressing.

## Architecture

- **Customer App**: React web app for ordering
- **Driver App**: React web app for drivers
- **Admin Dashboard**: React web app for management
- **Backend**: Node.js + Socket.IO for real-time updates

## Features

- 🗺️ Interactive Google Maps with pin selection
- 🚗 Live driver location tracking with smooth animation
- 🧭 Turn-by-turn navigation
- 📍 Landmark-based addressing (Malls, filling stations, schools, markets)
- 🔄 Automatic route recalculation
- ⏱️ ETA calculation and distance display
- 📞 Call driver and share live location
- 🛡️ Geofencing for arrival detection
- 📶 Offline map caching and fallback handling

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL with PostGIS
- Google Maps API key

### Backend Setup
```bash
cd backend-node
npm install
# Set up .env with DATABASE_URL, JWT_SECRET, GOOGLE_MAPS_API_KEY
npm run dev
```

### Frontend Setup
```bash
npm install
# Set up .env with REACT_APP_GOOGLE_MAPS_API_KEY
npm start
```

### Database Schema
```sql
-- Create tables for customers, drivers, orders, etc.
-- Include PostGIS for location data
```

## API Endpoints

- `POST /api/orders` - Create order with locations
- `GET /api/drivers/available-orders` - Get pending orders
- `POST /api/drivers/:id/accept/:orderId` - Accept delivery
- WebSocket events for real-time location updates

## Deployment

- Backend: Deploy to Heroku/Vercel with PostgreSQL
- Frontend: Deploy to Vercel/Netlify
- Use Redis for Socket.IO scaling in production

## Optimization for Lusaka

- Landmark search prioritized for local places
- Traffic data optimized for city road conditions
- Offline caching for areas with poor connectivity
- Support for informal addressing systems

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
