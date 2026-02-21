const axios = require('axios');
const config = require('./config');

// Pilih provider yang aktif
const provider = config.provider;
const providerConfig = config[provider];

const BASE_URL = providerConfig.baseUrl;

const parseError = (err) => {
    return err?.response?.data ? JSON.stringify(err.response.data) : (err.message || String(err));
};

async function createQris({ amount, orderId }) {
    if (provider === 'pakasir') {
        const url = `${BASE_URL}/transactioncreate/qris`;
        const body = {
            project: providerConfig.projectSlug,
            order_id: orderId,
            amount: amount,
            api_key: providerConfig.apiKey
        };
        try {
            const { data } = await axios.post(url, body, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            });
            if (!data || !data.payment) {
                throw new Error('Respons tidak valid dari server Pakasir.');
            }
            return data.payment;
        } catch (err) {
            err.message = 'createQris (Pakasir): ' + parseError(err);
            throw err;
        }
    } else if (provider === 'atlantic') {
        // Implementasi untuk Atlantic (sesuaikan dengan API mereka)
        // Contoh:
        const url = `${BASE_URL}/payment/qris`;
        const body = {
            merchantId: providerConfig.merchantId,
            orderId: orderId,
            amount: amount,
            apiKey: providerConfig.apiKey
            // ... parameter lain
        };
        try {
            const { data } = await axios.post(url, body, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            });
            // Sesuaikan dengan respons Atlantic
            return {
                payment_number: data.qrString, // ganti dengan field yang sesuai
                // ... field lain
            };
        } catch (err) {
            err.message = 'createQris (Atlantic): ' + parseError(err);
            throw err;
        }
    } else {
        throw new Error(`Provider ${provider} tidak dikenal`);
    }
}

async function getTransactionDetail({ amount, orderId }) {
    if (provider === 'pakasir') {
        const url = `${BASE_URL}/transactiondetail`;
        const params = {
            project: providerConfig.projectSlug,
            amount: amount,
            order_id: orderId,
            api_key: providerConfig.apiKey
        };
        try {
            const { data } = await axios.get(url, { params, timeout: 30000 });
            if (!data || !data.transaction) {
                throw new Error('Respons tidak valid dari server Pakasir.');
            }
            return data.transaction;
        } catch (err) {
            err.message = 'getTransactionDetail (Pakasir): ' + parseError(err);
            throw err;
        }
    } else if (provider === 'atlantic') {
        // Implementasi untuk Atlantic
        const url = `${BASE_URL}/transaction/${orderId}`;
        const params = {
            merchantId: providerConfig.merchantId,
            apiKey: providerConfig.apiKey
        };
        try {
            const { data } = await axios.get(url, { params, timeout: 30000 });
            // Sesuaikan dengan respons Atlantic
            return {
                status: data.status, // misal 'paid', 'pending', dll
                amount: data.amount,
                // ... field lain
            };
        } catch (err) {
            err.message = 'getTransactionDetail (Atlantic): ' + parseError(err);
            throw err;
        }
    } else {
        throw new Error(`Provider ${provider} tidak dikenal`);
    }
}

module.exports = { createQris, getTransactionDetail };