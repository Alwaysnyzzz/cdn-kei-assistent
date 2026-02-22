document.addEventListener('DOMContentLoaded', function() {
    // ===== AMBIL KONFIGURASI =====
    const config = window.WEBSITE_CONFIG || {};
    const IS_PRODUCTION = config.IS_PRODUCTION || false;
    const API_KEY = config.PAKASIR_API_KEY;
    const PROJECT_SLUG = config.PROJECT_SLUG;
    const API_URL = config.PAKASIR_API_URL || 'https://app.pakasir.com/api';

    // ===== ELEMEN DOM =====
    const urlParams = new URLSearchParams(window.location.search);
    const transactionId = urlParams.get('id');

    if (!transactionId) {
        alert('ID transaksi tidak ditemukan');
        window.location.href = '../donasi.html';
        return;
    }

    const stored = localStorage.getItem(`lobbyQris_${transactionId}`);
    if (!stored) {
        alert('Data transaksi tidak ditemukan');
        window.location.href = '../donasi.html';
        return;
    }

    const data = JSON.parse(stored);
    const amount = data.amount;
    const orderId = data.id;
    const paymentNumber = data.payment_number; // String QRIS asli dari Pakasir

    // ===== TAMPILKAN QR MENGGUNAKAN LIBRARY QRCODE =====
    const qrisImage = document.getElementById('qrisImage');
    const downloadQrisBtn = document.getElementById('downloadQrisBtn');

    if (paymentNumber) {
        QRCode.toDataURL(paymentNumber, { width: 300 }, function(err, url) {
            if (err) {
                console.error('QR Generation Error:', err);
                alert('Gagal membuat QR code. Silakan coba lagi.');
                return;
            }
            qrisImage.src = url;
            qrisImage.style.display = 'inline';
            downloadQrisBtn.dataset.qrUrl = url;
        });
    } else {
        // Fallback jika paymentNumber tidak ada (seharusnya tidak terjadi)
        qrisImage.src = data.qr_url;
        qrisImage.style.display = 'inline';
        downloadQrisBtn.dataset.qrUrl = data.qr_url;
    }

    document.getElementById('transactionId').textContent = transactionId;

    // ===== TIMER 10 MENIT =====
    function startTimer(expiry) {
        const timer = document.getElementById('timer');
        const update = () => {
            const diff = expiry - Date.now();
            if (diff <= 0) {
                timer.textContent = 'Kadaluarsa';
                return true;
            }
            const min = Math.floor(diff / 60000);
            const det = Math.floor((diff % 60000) / 1000);
            timer.textContent = `${min.toString().padStart(2,'0')}:${det.toString().padStart(2,'0')}`;
            return false;
        };
        update();
        setInterval(update, 1000);
    }
    startTimer(data.expiry);

    // ===== DOWNLOAD QR =====
    downloadQrisBtn.addEventListener('click', async function() {
        const url = this.dataset.qrUrl;
        if (!url) return;
        const blob = await fetch(url).then(r => r.blob());
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'qris.png';
        a.click();
    });

    // ===== CEK STATUS =====
    document.getElementById('checkStatusBtn').addEventListener('click', async function() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.add('show');
        const statusArea = document.getElementById('statusArea');
        statusArea.innerHTML = '';

        try {
            const response = await fetch(`${API_URL}/transactiondetail?project=${PROJECT_SLUG}&amount=${amount}&order_id=${orderId}&api_key=${API_KEY}`);
            const data = await response.json();
            overlay.classList.remove('show');

            if (data.transaction) {
                const tx = data.transaction;
                if (tx.status === 'completed' || tx.status === 'paid' || tx.status === 'success') {
                    statusArea.innerHTML = '<p style="color:#28a745;">✅ Status: Sukses</p>';
                    showSuccessModal();
                } else if (tx.status === 'pending' || tx.status === 'waiting') {
                    statusArea.innerHTML = '<p style="color:#ffccdd;">⏳ Status: Menunggu pembayaran</p>';
                } else {
                    statusArea.innerHTML = `<p style="color:#ff69b4;">Status: ${tx.status}</p>`;
                }
            } else {
                statusArea.innerHTML = '<p style="color:#ff69b4;">Transaksi tidak ditemukan</p>';
            }
        } catch (err) {
            overlay.classList.remove('show');
            console.error(err);
            statusArea.innerHTML = `<p style="color:#ff69b4;">Error: ${err.message}</p>`;
        }
    });

    // ===== SIMULASI BAYAR (HANYA UNTUK SANDBOX) =====
    const simulateBtn = document.getElementById('simulatePayBtn');
    if (simulateBtn) {
        if (IS_PRODUCTION) {
            simulateBtn.style.display = 'none';
        } else {
            simulateBtn.addEventListener('click', function() {
                if (!confirm('Jalankan simulasi pembayaran? (Hanya untuk uji coba)')) return;

                const stored = localStorage.getItem(`lobbyQris_${transactionId}`);
                if (!stored) return;

                const data = JSON.parse(stored);
                data.status = 'completed';
                data.completed_at = new Date().toISOString();
                localStorage.setItem(`lobbyQris_${transactionId}`, JSON.stringify(data));

                showSuccessModal();
            });
        }
    }

    // ===== MODAL SUKSES =====
    const successModal = document.getElementById('successModal');
    const successDetailBtn = document.getElementById('successDetailBtn');
    const successHomeBtn = document.getElementById('successHomeBtn');

    function showSuccessModal() {
        if (successModal) successModal.classList.add('show');
    }

    if (successDetailBtn) {
        successDetailBtn.addEventListener('click', function() {
            successModal.classList.remove('show');
            window.location.href = `../struk/struk.html?id=${transactionId}`;
        });
    }

    if (successHomeBtn) {
        successHomeBtn.addEventListener('click', function() {
            successModal.classList.remove('show');
            window.location.href = '../index.html';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === successModal) {
            successModal.classList.remove('show');
        }
    });

    // ===== BATALKAN TRANSAKSI =====
    const cancelBtn = document.getElementById('cancelBtn');
    const cancelModal = document.getElementById('cancelModal');
    const confirmYes = document.getElementById('confirmCancelYes');
    const confirmNo = document.getElementById('confirmCancelNo');

    cancelBtn.addEventListener('click', () => cancelModal.classList.add('show'));

    confirmYes.addEventListener('click', function() {
        localStorage.removeItem(`lobbyQris_${transactionId}`);
        cancelModal.classList.remove('show');
        window.location.href = '../donasi.html';
    });

    confirmNo.addEventListener('click', () => cancelModal.classList.remove('show'));

    window.addEventListener('click', (e) => {
        if (e.target === cancelModal) cancelModal.classList.remove('show');
    });

    // ===== PARTICLES (JIKA ADA) =====
    if (typeof particleground !== 'undefined') {
        particleground(document.getElementById('particles'), {
            dotColor: '#ffb6c1',
            lineColor: '#ff69b4',
            density: 12000
        });
    }
});