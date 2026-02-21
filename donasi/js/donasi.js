document.addEventListener('DOMContentLoaded', function() {
    // ===== KONFIGURASI =====
    const API_BASE_URL = 'https://vercel-upload-jet.vercel.app/api';

    // ===== ELEMEN DOM =====
    const payBtn = document.getElementById('payBtn');
    const quickAmountBtns = document.querySelectorAll('.quick-amount-btn');
    const customAmountInput = document.getElementById('customAmount');
    const applyCustomBtn = document.getElementById('applyCustomAmount');
    const selectedAmountDisplay = document.getElementById('selectedAmountDisplay');
    const selectedAmountText = document.getElementById('selectedAmountText');

    let selectedAmount = null;
    let selectedOrderId = null;

    // Cek jika ada data dari halaman input manual
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
        } catch (e) {
            console.error('Gagal parse pendingNominal', e);
        }
    }

    // Fungsi untuk generate Order ID
    function generateOrderId() {
        return 'DON-' + Date.now() + '-' + Math.random().toString(36).substring(2,8).toUpperCase();
    }

    // Tombol nominal cepat
    quickAmountBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Hapus class active dari semua
            quickAmountBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            selectedAmount = parseInt(this.dataset.amount);
            selectedOrderId = generateOrderId();
            selectedAmountText.textContent = `Rp ${selectedAmount.toLocaleString()}`;
            selectedAmountDisplay.style.display = 'block';
            payBtn.disabled = false;
        });
    });

    // Tombol input manual
    applyCustomBtn.addEventListener('click', function() {
        const customAmount = parseInt(customAmountInput.value);
        if (isNaN(customAmount) || customAmount < 230) {
            alert('Minimal Rp 230');
            return;
        }
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

        if (!selectedAmount || !selectedOrderId) {
            alert('Pilih nominal terlebih dahulu!');
            return;
        }

        payBtn.disabled = true;
        payBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

        try {
            console.log('Mengirim request ke:', API_BASE_URL + '/create-qris');
            const response = await fetch(`${API_BASE_URL}/create-qris`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: selectedAmount, orderId: selectedOrderId })
            });

            const data = await response.json();
            console.log('Respons dari server:', data);

            if (response.ok && data.success) {
                const payment = data.payment;
                const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payment.payment_number)}`;
                const expiry = Date.now() + 10 * 60 * 1000;

                // Simpan ke localStorage
                localStorage.setItem(`lobbyQris_${selectedOrderId}`, JSON.stringify({
                    id: selectedOrderId,
                    amount: selectedAmount,
                    qr_url: qrApiUrl,
                    expiry: expiry
                }));

                console.log('Data tersimpan, redirect ke lobby...');
                window.location.href = `lobbyqris/lobbyqris.html?id=${selectedOrderId}`;
            } else {
                alert('Gagal membuat QRIS: ' + (data.error || 'Respons tidak valid'));
                payBtn.disabled = false;
                payBtn.innerHTML = '<i class="fas fa-qrcode"></i> Buat QRIS';
            }
        } catch (err) {
            console.error('Fetch error:', err);
            alert('Terjadi kesalahan koneksi. Periksa console untuk detail.');
            payBtn.disabled = false;
            payBtn.innerHTML = '<i class="fas fa-qrcode"></i> Buat QRIS';
        }
    });

    // Inisialisasi particles
    if (typeof particleground !== 'undefined') {
        particleground(document.getElementById('particles'), {
            dotColor: '#ffb6c1',
            lineColor: '#ff69b4',
            density: 12000
        });
    } else {
        console.warn('particleground tidak ditemukan');
    }
});