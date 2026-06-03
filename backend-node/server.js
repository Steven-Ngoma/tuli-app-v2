require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Client } = require('@googlemaps/google-maps-services-js');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const googleMapsClient = new Client({});

app.use(cors());
app.use(express.json());

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

// Routes
app.post('/api/auth/register', async (req, res) => {
  const { name, phone, type, ...other } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const result = await pool.query(
      `INSERT INTO ${type}s (name, phone, password, ${Object.keys(other).join(', ')}) VALUES ($1, $2, $3, ${Object.keys(other).map((_, i) => `$${i+4}`).join(', ')}) RETURNING *`,
      [name, phone, hashedPassword, ...Object.values(other)]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { phone, password, type } = req.body;
  try {
    const result = await pool.query(`SELECT * FROM ${type}s WHERE phone = $1`, [phone]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'User not found' });

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, type }, process.env.JWT_SECRET);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Orders
app.post('/api/orders', verifyToken, async (req, res) => {
  const { pickupLocation, dropoffLocation, ...orderData } = req.body;
  try {
    // Calculate route and ETA using Google Maps
    const directions = await googleMapsClient.directions({
      params: {
        origin: pickupLocation,
        destination: dropoffLocation,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });

    const route = directions.data.routes[0];
    const distance = route.legs[0].distance.value / 1000; // km
    const duration = route.legs[0].duration.value / 60; // minutes

    const result = await pool.query(
      'INSERT INTO orders (customer_id, pickup_location, dropoff_location, distance, estimated_time, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, JSON.stringify(pickupLocation), JSON.stringify(dropoffLocation), distance, duration, 'pending']
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders WHERE customer_id = $1', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Driver routes
app.get('/api/drivers/available-orders', verifyToken, async (req, res) => {
  if (req.user.type !== 'driver') return res.status(403).json({ error: 'Not authorized' });
  try {
    const result = await pool.query("SELECT * FROM orders WHERE status = 'pending'");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/drivers/:driverId/accept/:orderId', verifyToken, async (req, res) => {
  if (req.user.type !== 'driver') return res.status(403).json({ error: 'Not authorized' });
  try {
    await pool.query('UPDATE orders SET driver_id = $1, status = $2 WHERE id = $3', [req.params.driverId, 'accepted', req.params.orderId]);
    res.json({ status: 'accepted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
  });

  socket.on('location-update', async (data) => {
    const { driverId, location } = data;
    // Update driver location in DB
    await pool.query('UPDATE drivers SET location = $1, last_seen = NOW() WHERE id = $2', [JSON.stringify(location), driverId]);

    // Broadcast to customers tracking this driver
    socket.to(`order-${data.orderId}`).emit('driver-location', location);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});