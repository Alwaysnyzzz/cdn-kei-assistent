document.addEventListener('DOMContentLoaded', function() {
    const config = window.WEBSITE_CONFIG || {};
    const MIN_AMOUNT = config.MIN_DONATION || 500;

    const submitBtn = document.getElementById('submitNominal');
    const amountInput = document.getElementById('customAmount');
    const errorMessage = document.getElementById('errorMessage');

    function validateAmount(amount) {
        if (isNaN(amount)) {
            errorMessage.textContent = 'Masukkan angka yang valid';
            return false;
        }
        if (amount < MIN_AMOUNT) {
            errorMessage.textContent = `Minimal Rp ${MIN_AMOUNT.toLocaleString()}`;
            return false;
        }
        errorMessage.textContent = '';
        return true;
    }

    function generateOrderId() {
        return 'DON-' + Date.now() + '-' + Math.random().toString(36).substring(2,8).toUpperCase();
    }

    submitBtn.addEventListener('click', function() {
        const amount = parseInt(amountInput.value);
        if (!validateAmount(amount)) return;

        const orderId = generateOrderId();

        // Simpan data transaksi ke localStorage
        const qrDummyData = `DONASI-${amount}-${orderId}`;
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrDummyData)}`;
        const expiry = Date.now() + 10 * 60 * 1000;

        const transactionData = {
            id: orderId,
            amount: amount,
            qr_url: qrApiUrl,
            expiry: expiry,
            status: 'pending',
            created_at: new Date().toISOString()
        };
        localStorage.setItem(`lobbyQris_${orderId}`, JSON.stringify(transactionData));

        // Redirect ke lobby
        window.location.href = `lobbyqris.html?id=${orderId}`;
    });

    amountInput.addEventListener('input', function() {
        const val = parseInt(amountInput.value);
        if (!isNaN(val) && val >= MIN_AMOUNT) {
            errorMessage.textContent = '';
        }
    });

    amountInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            submitBtn.click();
        }
    });
});