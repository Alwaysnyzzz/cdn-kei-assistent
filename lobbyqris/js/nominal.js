document.addEventListener('DOMContentLoaded', function() {
    const submitBtn = document.getElementById('submitNominal');
    const amountInput = document.getElementById('customAmount');
    const errorMessage = document.getElementById('errorMessage');

    function validateAmount(amount) {
        const minAmount = 230;
        if (isNaN(amount)) {
            errorMessage.textContent = 'Masukkan angka yang valid';
            return false;
        }
        if (amount < minAmount) {
            errorMessage.textContent = `Minimal transaksi adalah Rp ${minAmount.toLocaleString()}`;
            return false;
        }
        errorMessage.textContent = '';
        return true;
    }

    function generateOrderId() {
        const prefix = 'DON';
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${prefix}-${timestamp}${random}`;
    }

    submitBtn.addEventListener('click', function() {
        const amount = parseInt(amountInput.value);
        if (!validateAmount(amount)) return;

        const orderId = generateOrderId();
        // Langsung simpan data untuk lobby dan redirect
        localStorage.setItem('lobbyQris', JSON.stringify({ amount, orderId }));
        window.location.href = 'lobbyqris.html';
    });

    amountInput.addEventListener('input', function() {
        const amount = parseInt(amountInput.value);
        if (!isNaN(amount) && amount >= 230) {
            errorMessage.textContent = '';
        }
    });

    amountInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            submitBtn.click();
        }
    });
});