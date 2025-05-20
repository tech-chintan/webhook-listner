require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

const RECHARGE_API_TOKEN = process.env.RECHARGE_API_TOKEN;

async function listSubscriptions(customerId) {
  const url = `https://api.rechargeapps.com/subscriptions?customer_id=${customerId}&limit=250`;
  const res = await fetch(url, {
    headers: { 'X-Recharge-Access-Token': RECHARGE_API_TOKEN }
  });
  const data = await res.json();
  return data.subscriptions || [];
}

async function skipSubscription(id) {
  const url = `https://api.rechargeapps.com/subscriptions/${id}/skip`; // Recharge API v2021-11 or newer
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Recharge-Access-Token': RECHARGE_API_TOKEN,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    console.error(`Failed to skip subscription ${id}:`, await res.text());
  }
}

app.post('/api/webhook-skipped', async (req, res) => {

  if (!req.body?.subscription) {
    return res.status(500).json({ message: 'Recharge subsciption not found' });
  }

  const { subscription } = req.body
  const propsArray = subscription.properties || [];
  const props = Object.fromEntries(propsArray.map(p => [p.name, p.value]));
  const refId = props._ref_id;
  const isUpsell = props._is_upsell_box === 'true';

  if (refId) {
    const subs = await listSubscriptions(subscription.customer_id);
    const counterpart = subs.find(s => {
      const p = Object.fromEntries((s.properties || []).map(p => [p.name, p.value]));
      return p._ref_id === refId && !!p._is_upsell_box !== isUpsell; // match other side
    });
    if (counterpart) {
      // await skipSubscription(counterpart.id);
      console.log(`Auto-skipped paired subscription ${counterpart.id}`);
    }
  }

  res.status(200).json({ message: 'Webhook received from webhook-skipped' });
});

app.listen(port, () => {
  console.log(`Webhook listener running on port ${port}`);
});

module.exports = app; // Export the Express app for Vercel