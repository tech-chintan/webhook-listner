require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3005;
const cors = require('cors');

app.use(cors({
    origin: 'https://catladybox.myshopify.com', // or '*' for dev (not secure for production)
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const RECHARGE_API_TOKEN = process.env.RECHARGE_API_TOKEN;

async function listRechargeProducts(productId) {
    console.log(productId,111);
    const url = `https://api.rechargeapps.com/products/${productId}`;
    const res = await fetch(url, {
        headers: { 'X-Recharge-Access-Token': RECHARGE_API_TOKEN }
    });
    const data = await res.json();
    return data;
}

app.post('/api/recharge-product', async (req, res) => {
    const { productId } = req.body
    try {
        let data  = await listRechargeProducts(productId)
        res.status(200).json(data);
    } catch (error) {
        console.error("Recharge product erro:", error);
        res.status(500).json({ error: "Internal server error" });
    }
})

app.listen(port, () => {
    console.log(`Webhook listener running on port ${port}`);
});

module.exports = app; // Export the Express app for Vercel