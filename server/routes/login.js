const express = require('express');
const { authenticateUser, createAdmin, createUser } = require('../auth/users');

const app = express();

app.use(express.json());

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('Login attempt with body:', req.body);

    if (!username || !password) {
        console.log('Missing credentials');
        return res.status(400).json({ error: 'Username and password are required' });
    }

    console.log('Attempting login for user:', username);

    try {
        const user = await authenticateUser(username, password);
        if (user) {
            res.json({
                success: true,
                token: 'dummy-token', // TODO: Implement proper JWT token
                username: user.name,
                role: user.role,
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

app.post('/signup', async (req, res) => {
    const { username, password, isAdmin } = req.body;
    console.log('Signup request received:', { username, isAdmin });

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        let userId;
        if (isAdmin) {
            userId = await createUser(username, password, 'admin');
            console.log('Admin created with ID:', userId);
        } else {
            userId = await createUser(username, password, 'user');
            console.log('User created with ID:', userId);
        }
        
        if (userId) {
            // After creating the account, authenticate them
            const user = await authenticateUser(username, password);
            console.log('Authentication result:', user);
            
            if (user) {
                res.json({
                    success: true,
                    token: 'dummy-token', // TODO: Implement proper JWT token
                    username: user.name,
                    role: user.role,
                    id: user.id,
                });
            } else {
                res.status(401).json({ error: 'Account created but authentication failed' });
            }
        } else {
            res.status(500).json({ error: 'Failed to create account' });
        }
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: `Server error during signup: ${error.message}` });
    }
});

module.exports = app;