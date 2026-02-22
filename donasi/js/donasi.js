document.addEventListener('DOMContentLoaded', function() {
    // Ambil konfigurasi (default minimal 500)
    const config = window.WEBSITE_CONFIG || {};
    const MIN_AMOUNT = config.MIN_DONATION || 500;

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

    payBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (!selectedAmount || !selectedOrderId) {
            alert('Pilih nominal dulu');
            return;
        }

        // Simpan data transaksi ke localStorage (status pending)
        const qrDummyData = `DONASI-${selectedAmount}-${selectedOrderId}`;
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrDummyData)}`;
        const expiry = Date.now() + 10 * 60 * 1000; // 10 menit

        const transactionData = {
            id: selectedOrderId,
            amount: selectedAmount,
            qr_url: qrApiUrl,
            expiry: expiry,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        localStorage.setItem(`lobbyQris_${selectedOrderId}`, JSON.stringify(transactionData));
        window.location.href = `lobbyqris/lobbyqris.html?id=${selectedOrderId}`;
    });

    if (typeof particleground !== 'undefined') {
        particleground(document.getElementById('particles'), {
            dotColor: '#ffb6c1',
            lineColor: '#ff69b4',
            density: 12000
        });
    }
});