require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const getPool = require('./config');
const router = express.Router();

const documentsRoutes = require('./routes/documents');
const loginRoutes = require('./routes/login');
const testRoutes = require('./routes/test');

const app = express();

// Configure CORS
app.use(cors({
  origin: 'http://localhost:5173', // Allow your Vite frontend
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

(async () => {
  await getPool();

  // Add a test endpoint
  app.get('/test', (req, res) => {
    console.log('Test endpoint hit!');
    res.json({ message: 'Server is working!' });
  });

  // Add request logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.log('Request body:', req.body);
    next();
  });

  app.use('/api', router); // prefix all routes with /api

  router.use(documentsRoutes);
  router.use(loginRoutes);
  router.use(testRoutes);

  const port = process.env.server_port || 5000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Available routes:');
    console.log('- GET /test');
    console.log('- POST /api/login');
    console.log('- POST /api/signup');
  });
})();
