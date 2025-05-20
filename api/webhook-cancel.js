require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

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

app.post('/api/webhook-cancel', async (req, res) => {

  let { subscription } = req.body
  
  const props = subscription.properties || {};
  const refId = props._ref_id;
  const isUpsell = props._is_upsell_box === 'true';

  // If a main product subscription is cancelled, cancel its upsell counterpart
  if (!isUpsell && refId) {
    const subs = await listSubscriptions(subscription.customer_id);
    const target = subs.find(s => {
      const p = s.properties || {};
      return p._ref_id === refId && p._is_upsell_box === 'true';
    });
    if (target) {
      await cancelSubscription(target.id);
      console.log(`Auto-cancelled upsell subscription ${target.id}`);
    }
  }

  console.log('webhook-cancel');

  res.status(200).json({ message: 'Webhook received from webhook-cancel' });
});

app.listen(port, () => {
  console.log(`Webhook listener running on port ${port}`);
});

module.exports = app; // Export the Express app for Vercel