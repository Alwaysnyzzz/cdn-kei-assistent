const { createQris } = require('../donasi/pakasir');
const { saveTransaction } = require('./storage');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { amount, orderId } = req.body;
    if (!amount || !orderId) return res.status(400).json({ error: 'Missing amount or orderId' });

    try {
        const payment = await createQris({ amount, orderId });
        
        const transactionData = {
            id: orderId,
            amount,
            qr_string: payment.payment_number,
            qr_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payment.payment_number)}`,
            expiry: Date.now() + 10 * 60 * 1000,
            status: 'pending',
            created_at: new Date().toISOString()
        };
        
        await saveTransaction(orderId, transactionData);

        res.json({ 
            success: true, 
            payment: {
                ...payment,
                transactionId: orderId,
                qr_url: transactionData.qr_url
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};