require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3002;
const cors = require('cors');

app.use(cors({
    origin: 'https://catlady.com', // or '*' for dev (not secure for production)
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  

app.use(express.json());

const RECHARGE_API_TOKEN = process.env.RECHARGE_API_TOKEN;

app.post('/api/webhook-update', async (req, res) => {
    const { subscriptionId, variantId } = req.body;

    try {
        const response = await fetch(`https://api.rechargeapps.com/subscriptions/${subscriptionId}`, {
            method: "PUT",
            headers: {
                "X-Recharge-Access-Token": RECHARGE_API_TOKEN,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                shopify_variant_id: variantId
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.status(200).json(data);
    } catch (err) {
        console.error("Recharge update error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
})

app.listen(port, () => {
    console.log(`Webhook listener running on port ${port}`);
});

module.exports = app; // Export the Express app for Vercel