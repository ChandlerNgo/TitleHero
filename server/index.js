const express = require('express');
const cors = require('cors');
const { authenticateUser } = require('./auth/users');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send('Server is running.');
});

// Login route
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = authenticateUser(username, password);
  
  if (user) {
    // In a real app, you would generate a proper JWT token
    const token = `fake-jwt-token-${Math.random()}`;
    res.json({
      token,
      role: user.role,
      username: user.username
    });
  } else {
    res.status(401).json({ message: 'Invalid username or password' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
