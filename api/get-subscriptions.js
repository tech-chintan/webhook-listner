require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3004;
const cors = require('cors');

app.use(cors({
    origin: 'https://catladybox.myshopify.com', // or '*' for dev (not secure for production)
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const RECHARGE_API_TOKEN = process.env.RECHARGE_API_TOKEN;

async function listSubscriptions(subscriptionId) {
    const url = `https://api.rechargeapps.com/subscriptions/${subscriptionId}`;
    const res = await fetch(url, {
        headers: { 'X-Recharge-Access-Token': RECHARGE_API_TOKEN }
    });
    const data = await res.json();
    return data.subscriptions || [];
}

app.get('/api/subscriptions', async (req, res) => {
    const { subscriptionId } = req.body
    console.log(subscriptionId,666);
    try {
        await listSubscriptions(subscriptionId)
        res.status(200).json({ message: 'sucess' });
    } catch (error) {
        console.error("Recharge update error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
})

app.listen(port, () => {
    console.log(`Webhook listener running on port ${port}`);
});

module.exports = app; // Export the Express app for Vercel