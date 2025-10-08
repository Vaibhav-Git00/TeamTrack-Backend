require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ["https://team-track-frontend.vercel.app"]
    : [
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://localhost:4173", 
        "http://127.0.0.1:3000", 
        "http://127.0.0.1:3001", 
        "http://127.0.0.1:4173",
        "https://team-track-frontend.vercel.app"
      ],
  credentials: true
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running!' });
});

app.post('/api/test', (req, res) => {
  res.json({ message: 'Test endpoint working!', data: req.body });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
