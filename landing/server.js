const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve the main HTML file for all routes (SPA behavior)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 TeamCollab Landing Page is running on http://localhost:${PORT}`);
    console.log(`📱 Open your browser and visit the URL above to see the landing page`);
    console.log(`🎨 Features: Smooth animations, responsive design, and interactive elements`);
});

module.exports = app;
