const express = require('express');

const app = express();

app.get('/login', (req, res) => {
    res.send('Login route is working!');
});

module.exports = app;