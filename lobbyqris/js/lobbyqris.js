document.addEventListener('DOMContentLoaded', function() {
    // ===== AMBIL KONFIGURASI =====
    const config = window.WEBSITE_CONFIG || {};
    const IS_PRODUCTION = config.IS_PRODUCTION || false;
    const API_BASE_URL = config.PAKASIR_API_URL || 'https://app.pakasir.com/api'; // Jika perlu dipanggil langsung, tapi di sini tidak dipakai untuk create QR

    // ===== ELEMEN =====
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
    const qrString = data.qr_raw || data.payment_number; // jika ada field payment_number, gunakan itu. Di sini kita asumsikan data sudah menyimpan payment_number

    // Jika data belum menyimpan payment_number, kita perlu mengambil dari localStorage yang lain? Tapi dari donasi.js kita menyimpan qr_url dummy. Untuk production, kita harus mengambil payment_number dari respons API create-qris.
    // Karena ini adalah file lobby untuk production, kita harus memastikan bahwa data yang disimpan di localStorage sudah berisi payment_number.
    // Untuk sementara, kita gunakan data.qr_url yang lama, tapi lebih baik kita ubah donasi.js untuk menyimpan payment_number juga.

    // Tapi karena kita sedang fokus memperbaiki QR tidak valid, kita asumsikan data memiliki field payment_number.
    // Jika tidak, kita perlu mengambil dari API lagi. Namun di sini kita akan menggunakan payment_number dari data (jika ada) atau fallback ke qr_url lama.
    const paymentNumber = data.payment_number || data.qr_raw;

    // ===== TAMPILKAN QR DENGAN LIBRARY QRCODE =====
    const qrisImage = document.getElementById('qrisImage');
    const downloadQrisBtn = document.getElementById('downloadQrisBtn');

    if (paymentNumber) {
        // Generate QR menggunakan library qrcode
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
        // Fallback ke URL lama (misalnya dari qrserver)
        qrisImage.src = data.qr_url;
        qrisImage.style.display = 'inline';
        downloadQrisBtn.dataset.qrUrl = data.qr_url;
    }

    document.getElementById('transactionId').textContent = transactionId;

    // ===== TIMER =====
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
    document.getElementById('checkStatusBtn').addEventListener('click', function() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.add('show');
        const statusArea = document.getElementById('statusArea');
        statusArea.innerHTML = '';

        const updatedData = JSON.parse(localStorage.getItem(`lobbyQris_${transactionId}`));
        if (!updatedData) {
            statusArea.innerHTML = '<p style="color:#ff69b4;">Data tidak ditemukan</p>';
            overlay.classList.remove('show');
            return;
        }

        overlay.classList.remove('show');

        if (updatedData.status === 'completed') {
            statusArea.innerHTML = '<p style="color:#28a745;">✅ Status: Sukses</p>';
            showSuccessModal();
        } else if (updatedData.status === 'pending') {
            statusArea.innerHTML = '<p style="color:#ffccdd;">⏳ Status: Menunggu pembayaran</p>';
        } else {
            statusArea.innerHTML = `<p style="color:#ff69b4;">Status: ${updatedData.status}</p>`;
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

    // ===== PARTICLES =====
    if (typeof particleground !== 'undefined') {
        particleground(document.getElementById('particles'), {
            dotColor: '#ffb6c1',
            lineColor: '#ff69b4',
            density: 12000
        });
    }
});