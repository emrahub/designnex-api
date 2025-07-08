const express = require('express');
const path = require('path');

const app = express();
const PORT = 7000;

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 DesignNex Studio Frontend running on http://localhost:${PORT}`);
  console.log(`📱 Ready for customization requests`);
  console.log(`🎯 Test URL: http://localhost:${PORT}/?product_id=123&mode=customize`);
});