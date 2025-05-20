require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

const RECHARGE_API_TOKEN = process.env.RECHARGE_API_TOKEN;

async function cancelSubscription(id) {
  const url = `https://api.rechargeapps.com/subscriptions/${id}/cancel`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Recharge-Access-Token': RECHARGE_API_TOKEN,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    console.error(`Failed to cancel subscription ${id}:`, await res.text());
  }
}

async function listSubscriptions(customerId) {
  const url = `https://api.rechargeapps.com/subscriptions?customer_id=${customerId}&limit=250`;
  const res = await fetch(url, {
    headers: { 'X-Recharge-Access-Token': RECHARGE_API_TOKEN }
  });
  const data = await res.json();
  return data.subscriptions || [];
}

app.post('/api/webhook-update', async (req, res) => {


  console.log('webhook-update');

  res.status(200).json({ message: 'Webhook received from webhook-update' });
});

app.listen(port, () => {
  console.log(`Webhook listener running on port ${port}`);
});

module.exports = app; // Export the Express app for Vercel