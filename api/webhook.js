const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/api/webhook', (req, res) => {
  console.log('Webhook received:', req.body);
  res.status(200).json({ message: 'Webhook received successfully' });
});

app.listen(port, () => {
  console.log(`Webhook listener running on port ${port}`);
});

module.exports = app; // Export the Express app for Vercel