const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const http = require('http');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});

// Routes
app.use('/api/questions', require('./routes/questions'));
app.use('/api/contests', require('./routes/contests'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Keep-alive ping to prevent Render from idling
setInterval(() => {
  const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  http.get(url, (res) => {
    console.log('Keep-alive ping sent:', url, 'Status:', res.statusCode);
  }).on('error', (err) => {
    console.error('Keep-alive ping error:', err.message);
  });
}, 10 * 60 * 1000); // every 10 minutes 