document.addEventListener('DOMContentLoaded', function() {
    console.log('donasi.js loaded'); // Untuk cek di console

    const config = window.WEBSITE_CONFIG || {};
    const API_KEY = config.PAKASIR_API_KEY;
    const PROJECT_SLUG = config.PROJECT_SLUG;
    const API_URL = config.PAKASIR_API_URL || 'https://app.pakasir.com/api';
    const MIN_AMOUNT = config.MIN_DONATION || 500;

    const payBtn = document.getElementById('payBtn');
    const quickAmountBtns = document.querySelectorAll('.quick-amount-btn');
    const customAmountInput = document.getElementById('customAmount');
    const applyCustomBtn = document.getElementById('applyCustomAmount');
    const selectedAmountDisplay = document.getElementById('selectedAmountDisplay');
    const selectedAmountText = document.getElementById('selectedAmountText');

    let selectedAmount = null;
    let selectedOrderId = null;

    // Set placeholder input manual
    if (customAmountInput) {
        customAmountInput.min = MIN_AMOUNT;
        customAmountInput.placeholder = `Min ${MIN_AMOUNT.toLocaleString()}`;
    }

    function generateOrderId() {
        return 'DON-' + Date.now() + '-' + Math.random().toString(36).substring(2,8).toUpperCase();
    }

    // Validasi API Key
    if (!API_KEY || !PROJECT_SLUG) {
        console.error('API Key atau Project Slug tidak ditemukan di config.js');
        alert('Konfigurasi tidak lengkap. Hubungi admin.');
        payBtn.disabled = true;
        return;
    }

    // Tombol nominal cepat
    quickAmountBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            console.log('Nominal button clicked:', this.dataset.amount);
            quickAmountBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedAmount = parseInt(this.dataset.amount);
            selectedOrderId = generateOrderId();
            selectedAmountText.textContent = `Rp ${selectedAmount.toLocaleString()}`;
            selectedAmountDisplay.style.display = 'block';
            payBtn.disabled = false;
        });
    });

    // Tombol custom nominal
    applyCustomBtn.addEventListener('click', function() {
        const customAmount = parseInt(customAmountInput.value);
        if (isNaN(customAmount) || customAmount < MIN_AMOUNT) {
            alert(`Minimal Rp ${MIN_AMOUNT.toLocaleString()}`);
            return;
        }
        console.log('Custom amount:', customAmount);
        selectedAmount = customAmount;
        selectedOrderId = generateOrderId();
        selectedAmountText.textContent = `Rp ${selectedAmount.toLocaleString()}`;
        selectedAmountDisplay.style.display = 'block';
        payBtn.disabled = false;
        quickAmountBtns.forEach(b => b.classList.remove('active'));
    });

    // Tombol Buat QRIS
    payBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        console.log('Pay button clicked');

        if (!selectedAmount || !selectedOrderId) {
            alert('Pilih nominal dulu');
            return;
        }

        payBtn.disabled = true;
        payBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghubungi Pakasir...';

        try {
            console.log('Sending request to Pakasir:', {
                project: PROJECT_SLUG,
                order_id: selectedOrderId,
                amount: selectedAmount,
                api_key: '***' // Jangan log API key asli
            });

            const response = await fetch(`${API_URL}/transactioncreate/qris`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project: PROJECT_SLUG,
                    order_id: selectedOrderId,
                    amount: selectedAmount,
                    api_key: API_KEY
                })
            });

            const data = await response.json();
            console.log('Response from Pakasir:', data);

            if (data.payment) {
                const payment = data.payment;
                const qrString = payment.payment_number;
                const expiry = Date.now() + 10 * 60 * 1000; // 10 menit

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
                console.log('Data saved to localStorage, redirecting to lobby...');
                window.location.href = `lobbyqris/lobbyqris.html?id=${selectedOrderId}`;
            } else {
                alert('Gagal: ' + (data.error || JSON.stringify(data)));
                payBtn.disabled = false;
                payBtn.innerHTML = '<i class="fas fa-qrcode"></i> Buat QRIS';
            }
        } catch (err) {
            console.error('Fetch error:', err);
            alert('Gagal menghubungi server. Periksa koneksi atau CORS. Lihat console untuk detail.');
            payBtn.disabled = false;
            payBtn.innerHTML = '<i class="fas fa-qrcode"></i> Buat QRIS';
        }
    });

    // Inisialisasi particles (jika ada)
    if (typeof particleground !== 'undefined') {
        particleground(document.getElementById('particles'), {
            dotColor: '#ffb6c1',
            lineColor: '#ff69b4',
            density: 12000
        });
    }
});