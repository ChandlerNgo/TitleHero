const express = require('express');

const app = express();

app.get('/test', (req, res) => {
    res.send('Test route is working!');
});

module.exports = app;