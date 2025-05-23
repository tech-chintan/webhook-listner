require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3008;
const cors = require('cors');

// Enable CORS for your Shopify frontend
app.use(cors({
    origin: 'https://catladybox.myshopify.com', // or '*' for dev (not secure for production)
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Recharge API configuration
const RECHARGE_API_TOKEN = process.env.RECHARGE_API_TOKEN;

const RECHARGE_API_URL = 'https://api.rechargeapps.com';
const headers = {
    "X-Recharge-Access-Token": RECHARGE_API_TOKEN,
    "Content-Type": "application/json",
    "Accept": "application/json"
};

// Endpoint to update subscription variant and queued orders
app.post('/api/update-subscription-variant', async (req, res) => {
    const { subscriptionId, newVariantId } = req.body;

    if (!subscriptionId || !newVariantId) {
        return res.status(400).json({ error: 'Missing subscriptionId or newVariantId' });
    }

    try {
        const subscriptionResponse = await fetch(`https://api.rechargeapps.com/subscriptions/${subscriptionId}`, {
            method: "PUT",
            headers: {
                "X-Recharge-Access-Token": RECHARGE_API_TOKEN,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                shopify_variant_id: newVariantId
            })
        });
        const {subscription} = await subscriptionResponse.json();

        if (!subscriptionResponse.ok) {
            throw new Error(`Failed to update subscription: ${subscriptionResponse.status}`);
        }

        const ordersResponse = await fetch(
            `${RECHARGE_API_URL}/orders?status=QUEUED&subscription_id=${subscriptionId}`,
            { method: 'GET', headers }
        );
        if (!ordersResponse.ok) {
            throw new Error(`Failed to fetch orders: ${ordersResponse.status}`);
        }
        const { orders } = await ordersResponse.json();
        // Step 3: Update each queued order
        for (const order of orders) {
            // Get current order details
            const orderResponse = await fetch(`${RECHARGE_API_URL}/orders/${order.id}`, {
                method: 'GET',
                headers
            });
            if (!orderResponse.ok) {
                throw new Error(`Failed to fetch order ${order.id}: ${orderResponse.status}`);
            }
            const { order: currentOrder } = await orderResponse.json();
            // Update line_items with new variant_id
            const updatedLineItems = currentOrder.line_items.map(item => ({
                shopify_variant_id: subscription.shopify_variant_id,
                shopify_product_id: subscription.shopify_product_id,
                quantity: 1,
                variant_title :subscription.variant_title,
                product_title:subscription.product_title
            }));

            // Update the order
            const updateOrderResponse = await fetch(`${RECHARGE_API_URL}/orders/${order.id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ line_items: updatedLineItems })
            });
            if (!updateOrderResponse.ok) {
                throw new Error(`Failed to update order ${order.id}: ${updateOrderResponse.status}`);
            }
        }

        res.json({
            success: true,
            message: `Updated subscription ${subscriptionId} and ${orders.length} orders to variant ${newVariantId}`
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Failed to update variant' });
    }
});

app.listen(port, () => {
    console.log(`Webhook listener running on port ${port}`);
});

module.exports = app; // Export the Express app for Vercel