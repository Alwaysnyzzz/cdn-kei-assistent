document.addEventListener('DOMContentLoaded', function() {
    const config = window.WEBSITE_CONFIG || {};
    const API_BASE_URL = config.API_BASE_URL;
    const MIN_AMOUNT = config.MIN_DONATION || 500;

    const payBtn = document.getElementById('payBtn');
    const quickAmountBtns = document.querySelectorAll('.quick-amount-btn');
    const customAmountInput = document.getElementById('customAmount');
    const applyCustomBtn = document.getElementById('applyCustomAmount');
    const selectedAmountDisplay = document.getElementById('selectedAmountDisplay');
    const selectedAmountText = document.getElementById('selectedAmountText');

    let selectedAmount = null;
    let selectedOrderId = null;

    // Validasi hanya URL backend
    if (!API_BASE_URL) {
        alert('Konfigurasi tidak lengkap (URL backend tidak ditemukan). Hubungi admin.');
        payBtn.disabled = true;
        return;
    }

    if (customAmountInput) {
        customAmountInput.min = MIN_AMOUNT;
        customAmountInput.placeholder = `Min ${MIN_AMOUNT.toLocaleString()}`;
    }

    function generateOrderId() {
        return 'DON-' + Date.now() + '-' + Math.random().toString(36).substring(2,8).toUpperCase();
    }

    quickAmountBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            quickAmountBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedAmount = parseInt(this.dataset.amount);
            selectedOrderId = generateOrderId();
            selectedAmountText.textContent = `Rp ${selectedAmount.toLocaleString()}`;
            selectedAmountDisplay.style.display = 'block';
            payBtn.disabled = false;
        });
    });

    applyCustomBtn.addEventListener('click', function() {
        const customAmount = parseInt(customAmountInput.value);
        if (isNaN(customAmount) || customAmount < MIN_AMOUNT) {
            alert(`Minimal Rp ${MIN_AMOUNT.toLocaleString()}`);
            return;
        }
        selectedAmount = customAmount;
        selectedOrderId = generateOrderId();
        selectedAmountText.textContent = `Rp ${selectedAmount.toLocaleString()}`;
        selectedAmountDisplay.style.display = 'block';
        payBtn.disabled = false;
        quickAmountBtns.forEach(b => b.classList.remove('active'));
    });

    payBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        if (!selectedAmount || !selectedOrderId) {
            alert('Pilih nominal dulu');
            return;
        }

        payBtn.disabled = true;
        payBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghubungi backend...';

        try {
            const response = await fetch(`${API_BASE_URL}/create-qris`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: selectedAmount, orderId: selectedOrderId })
            });
            const data = await response.json();

            if (response.ok && data.success) {
                const payment = data.payment;
                const qrString = payment.payment_number;
                const expiry = Date.now() + 10 * 60 * 1000;

                const transactionData = {
                    id: selectedOrderId,
                    amount: selectedAmount,
                    payment_number: qrString,
                    expiry: expiry,
                    status: 'pending',
                    created_at: new Date().toISOString(),
                    order_id: payment.order_id
                };

                localStorage.setItem(`lobbyQris_${selectedOrderId}`, JSON.stringify(transactionData));
                window.location.href = `lobbyqris/lobbyqris.html?id=${selectedOrderId}`;
            } else {
                alert('Gagal: ' + (data.error || JSON.stringify(data)));
                payBtn.disabled = false;
                payBtn.innerHTML = '<i class="fas fa-qrcode"></i> Buat QRIS';
            }
        } catch (err) {
            console.error('Fetch error:', err);
            alert('Gagal menghubungi backend. Periksa koneksi.');
            payBtn.disabled = false;
            payBtn.innerHTML = '<i class="fas fa-qrcode"></i> Buat QRIS';
        }
    });

    if (typeof particleground !== 'undefined') {
        particleground(document.getElementById('particles'), {
            dotColor: '#ffb6c1',
            lineColor: '#ff69b4',
            density: 12000
        });
    }
});