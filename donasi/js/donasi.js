document.addEventListener('DOMContentLoaded', function() {
    // Ambil konfigurasi (jika ada) atau gunakan default
    const config = window.DONASI_CONFIG || {};
    const API_BASE_URL = config.API_BASE_URL || 'https://vercel-upload-jet.vercel.app/api';
    const MIN_AMOUNT = config.MIN_AMOUNT || 500;

    const payBtn = document.getElementById('payBtn');
    const quickAmountBtns = document.querySelectorAll('.quick-amount-btn');
    const customAmountInput = document.getElementById('customAmount');
    const applyCustomBtn = document.getElementById('applyCustomAmount');
    const selectedAmountDisplay = document.getElementById('selectedAmountDisplay');
    const selectedAmountText = document.getElementById('selectedAmountText');

    let selectedAmount = null;
    let selectedOrderId = null;

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
        payBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

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
                const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrString)}`;
                const expiry = Date.now() + 10 * 60 * 1000; // 10 menit

                localStorage.setItem(`lobbyQris_${selectedOrderId}`, JSON.stringify({
                    id: selectedOrderId,
                    amount: selectedAmount,
                    qr_url: qrApiUrl,
                    expiry: expiry,
                    order_id: payment.order_id
                }));

                window.location.href = `lobbyqris/lobbyqris.html?id=${selectedOrderId}`;
            } else {
                alert('Gagal: ' + (data.error || 'Respons tidak valid'));
                payBtn.disabled = false;
                payBtn.innerHTML = '<i class="fas fa-qrcode"></i> Buat QRIS';
            }
        } catch (err) {
            alert('Error: ' + err.message);
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