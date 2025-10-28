require('dotenv').config();
const express = require('express');
const getPool = require('./config');
const router = express.Router();

const documentsRoutes = require('./routes/documents');
const loginRoutes = require('./routes/login');
const testRoutes = require('./routes/test');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

(async () => {
  await getPool();

  app.use('/api', router); // prefix all routes with /api

  router.use(documentsRoutes);
  router.use(loginRoutes);
  router.use(testRoutes);

  const port = process.env.SERVER_PORT || 5000;
  app.listen(port, () => console.log(`Server running on port ${port}`));
})();
