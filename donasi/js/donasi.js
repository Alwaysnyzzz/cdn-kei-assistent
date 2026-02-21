document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'https://vercel-upload-jet.vercel.app/api'; // GANTI DENGAN URL VERCEL ANDA

    const payBtn = document.getElementById('payBtn');
    const amountInput = document.getElementById('amount');
    const quickAmountBtns = document.querySelectorAll('.quick-amount-btn');
    const customAmountInput = document.getElementById('customAmount');
    const applyCustomBtn = document.getElementById('applyCustomAmount');
    const selectedAmountDisplay = document.getElementById('selectedAmountDisplay');
    const selectedAmountText = document.getElementById('selectedAmountText');

    let selectedAmount = null;
    let selectedOrderId = null;

    // Cek pending nominal dari halaman nominal
    const pendingData = localStorage.getItem('pendingNominal');
    if (pendingData) {
        try {
            const data = JSON.parse(pendingData);
            selectedAmount = data.amount;
            selectedOrderId = data.orderId;
            selectedAmountText.textContent = `Rp ${selectedAmount.toLocaleString()}`;
            selectedAmountDisplay.style.display = 'block';
            payBtn.disabled = false;
            localStorage.removeItem('pendingNominal');
            quickAmountBtns.forEach(b => b.classList.remove('active'));
        } catch (e) {}
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
        if (validateAmount(customAmount)) {
            selectedAmount = customAmount;
            selectedOrderId = generateOrderId();
            amountInput.value = customAmount;
            selectedAmountText.textContent = `Rp ${selectedAmount.toLocaleString()}`;
            selectedAmountDisplay.style.display = 'block';
            payBtn.disabled = false;
            quickAmountBtns.forEach(b => b.classList.remove('active'));
        }
    });

    function validateAmount(amount) {
        const minAmount = 230;
        if (isNaN(amount) || amount < minAmount) {
            alert(`Minimal Rp ${minAmount.toLocaleString()}`);
            return false;
        }
        return true;
    }

    function generateOrderId() {
        const prefix = 'DON';
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${prefix}-${timestamp}${random}`;
    }

    payBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        if (!selectedAmount || !selectedOrderId) {
            alert('Pilih nominal terlebih dahulu');
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
                const expiry = Date.now() + 10 * 60 * 1000;

                const transactionData = {
                    id: selectedOrderId,
                    amount: selectedAmount,
                    qr_url: qrApiUrl,
                    expiry: expiry
                };
                localStorage.setItem(`lobbyQris_${selectedOrderId}`, JSON.stringify(transactionData));

                window.location.href = `lobbyqris/lobbyqris.html?id=${selectedOrderId}`;
            } else {
                alert('Gagal membuat QRIS: ' + (data.error || 'Unknown error'));
                payBtn.disabled = false;
                payBtn.innerHTML = '<i class="fas fa-qrcode"></i> Buat QRIS';
            }
        } catch (err) {
            alert('Error: ' + err.message);
            payBtn.disabled = false;
            payBtn.innerHTML = '<i class="fas fa-qrcode"></i> Buat QRIS';
        }
    });

    particleground(document.getElementById('particles'), {
        dotColor: '#ffb6c1',
        lineColor: '#ff69b4',
        density: 12000
    });
});