const { getTransactionDetail } = require('../donasi/pakasir');
const { updateTransactionStatus } = require('./storage');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { amount, orderId } = req.body;
    if (!amount || !orderId) return res.status(400).json({ error: 'Missing amount or orderId' });

    try {
        const transaction = await getTransactionDetail({ amount, orderId });
        await updateTransactionStatus(orderId, transaction.status);
        res.json({ success: true, transaction });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};