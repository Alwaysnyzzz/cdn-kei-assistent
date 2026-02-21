document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'https://vercel-upload-jet.vercel.app/api'; // GANTI DENGAN URL VERCEL ANDA

    const qrisImage = document.getElementById('qrisImage');
    const downloadQrisBtn = document.getElementById('downloadQrisBtn');
    const checkStatusBtn = document.getElementById('checkStatusBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const statusArea = document.getElementById('statusArea');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    const localLoading = document.getElementById('localLoading');
    const timerElement = document.getElementById('timer');
    
    const cancelModal = document.getElementById('cancelModal');
    const confirmYes = document.getElementById('confirmCancelYes');
    const confirmNo = document.getElementById('confirmCancelNo');

    // Ambil data dari localStorage
    const lobbyData = JSON.parse(localStorage.getItem('lobbyQris'));
    if (!lobbyData || !lobbyData.amount || !lobbyData.orderId) {
        alert('Data tidak ditemukan. Kembali ke halaman donasi.');
        window.location.href = '../donasi.html';
        return;
    }

    const { amount, orderId } = lobbyData;
    let expiryTime = localStorage.getItem('qrisExpiry');
    let qrUrl = localStorage.getItem('qrisImageUrl');

    // Fungsi untuk memulai timer dan langsung memperbarui tampilan
    function startTimer(expiryTimestamp) {
        // Fungsi untuk memperbarui tampilan timer
        const updateTimer = () => {
            const now = Date.now();
            const diff = expiryTimestamp - now;
            if (diff <= 0) {
                timerElement.textContent = 'Kadaluarsa';
                statusArea.innerHTML = '<p style="color:#ff69b4; text-align:center;">QRIS telah kadaluarsa. Silakan buat transaksi baru.</p>';
                checkStatusBtn.disabled = true;
                cancelBtn.disabled = true;
                downloadQrisBtn.disabled = true;
                localStorage.removeItem('lobbyQris');
                localStorage.removeItem('qrisExpiry');
                localStorage.removeItem('qrisImageUrl');
                return true; // menandakan sudah expired
            }
            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            return false;
        };

        // Update segera
        const expired = updateTimer();
        if (expired) return;

        // Set interval untuk update setiap detik
        const interval = setInterval(() => {
            const expired = updateTimer();
            if (expired) clearInterval(interval);
        }, 1000);
        return interval;
    }

    // Jika QR masih valid, tampilkan langsung
    if (qrUrl && expiryTime && parseInt(expiryTime) > Date.now()) {
        qrisImage.src = qrUrl;
        qrisImage.style.display = 'inline';
        downloadQrisBtn.dataset.qrUrl = qrUrl;
        startTimer(parseInt(expiryTime));
        // Tombol sudah aktif secara default
    } else {
        // Hapus data kadaluarsa
        localStorage.removeItem('lobbyQris');
        localStorage.removeItem('qrisExpiry');
        localStorage.removeItem('qrisImageUrl');

        // Buat QRIS baru
        loadingText.textContent = 'Sedang membuat QRIS, mohon tunggu...';
        loadingOverlay.classList.add('show');

        async function createQris() {
            try {
                const response = await fetch(`${API_BASE_URL}/create-qris`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount, orderId })
                });
                const data = await response.json();
                loadingOverlay.classList.remove('show');

                if (response.ok && data.success) {
                    const payment = data.payment;
                    const qrString = payment.payment_number;
                    qrisImage.style.display = 'none';
                    localLoading.style.display = 'flex';
                    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrString)}`;
                    const expiry = Date.now() + 10 * 60 * 1000;
                    localStorage.setItem('qrisExpiry', expiry);
                    localStorage.setItem('qrisImageUrl', qrApiUrl);
                    setTimeout(() => {
                        localLoading.style.display = 'none';
                        qrisImage.src = qrApiUrl;
                        qrisImage.style.display = 'inline';
                        downloadQrisBtn.dataset.qrUrl = qrApiUrl;
                        startTimer(expiry);
                    }, 1500);
                } else {
                    const errorMsg = data.error || 'Unknown error';
                    window.location.href = `../error/error.html?code=${encodeURIComponent(errorMsg)}`;
                }
            } catch (err) {
                loadingOverlay.classList.remove('show');
                window.location.href = `../error/error.html?code=${encodeURIComponent(err.message)}`;
            }
        }

        createQris();
    }

    // Fungsi download QR
    async function downloadQR(url) {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = 'qris.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            alert('Gagal mendownload QR: ' + err.message);
        }
    }

    downloadQrisBtn.addEventListener('click', function() {
        const qrUrl = this.dataset.qrUrl;
        if (qrUrl) downloadQR(qrUrl);
        else alert('QR belum tersedia');
    });

    // Cek status transaksi
    checkStatusBtn.addEventListener('click', async function() {
        loadingText.textContent = 'Mengecek Pembayaran...';
        loadingOverlay.classList.add('show');
        statusArea.innerHTML = '';

        try {
            const response = await fetch(`${API_BASE_URL}/check-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, orderId })
            });
            const data = await response.json();
            loadingOverlay.classList.remove('show');

            if (response.ok && data.success) {
                const tx = data.transaction;
                if (tx.status === 'success' || tx.status === 'paid') {
                    statusArea.innerHTML = `
                        <div class="status-success">
                            <div class="success-circle animated-pulse">
                                <i class="fas fa-check"></i>
                            </div>
                            <h3>Pembayaran Sukses!</h3>
                            <div class="transaction-details">
                                <p><strong>Status:</strong> <span style="color: #28a745;">Sukses ✅</span></p>
                                <p><strong>Jumlah:</strong> Rp ${tx.amount?.toLocaleString() || amount.toLocaleString()}</p>
                                <p><strong>Fee:</strong> Rp ${tx.fee?.toLocaleString() || '1.400'}</p>
                                <p><strong>Saldo diterima:</strong> Rp ${tx.net?.toLocaleString() || (amount - 1400).toLocaleString()}</p>
                                <p><strong>Via:</strong> QRIS</p>
                                <p><strong>Order ID:</strong> ${tx.order_id || orderId}</p>
                            </div>
                            <button class="btn-struk" id="viewReceiptBtn">Lihat Struk</button>
                        </div>
                    `;
                } else if (tx.status === 'pending' || tx.status === 'waiting') {
                    statusArea.innerHTML = `
                        <div style="text-align:center; color:#ffccdd;">
                            <p>Pembayaran masih dalam antrian.</p>
                            <p>Silakan scan QRIS dan lakukan pembayaran.</p>
                        </div>
                    `;
                } else {
                    statusArea.innerHTML = `
                        <div class="status-failed">
                            <div class="failed-circle">
                                <i class="fas fa-times"></i>
                            </div>
                            <h3>Sayangnya pembayaran belum masuk</h3>
                            <p>Status: ${tx.status || 'unknown'}</p>
                            <button class="btn-struk" id="retryBtn">Coba Lagi</button>
                        </div>
                    `;
                }
            } else {
                statusArea.innerHTML = `<div class="status-failed"><p>Error: ${data.error || 'Gagal cek status'}</p></div>`;
            }
        } catch (err) {
            loadingOverlay.classList.remove('show');
            statusArea.innerHTML = `<div class="status-failed"><p>Error: ${err.message}</p></div>`;
        }
    });

    // Batalkan transaksi
    cancelBtn.addEventListener('click', () => cancelModal.classList.add('show'));

    confirmYes.addEventListener('click', () => {
        cancelModal.classList.remove('show');
        localStorage.removeItem('lobbyQris');
        localStorage.removeItem('qrisExpiry');
        localStorage.removeItem('qrisImageUrl');
        window.location.href = '../donasi.html';
    });

    confirmNo.addEventListener('click', () => cancelModal.classList.remove('show'));

    window.addEventListener('click', (e) => {
        if (e.target === cancelModal) cancelModal.classList.remove('show');
    });

    particleground(document.getElementById('particles'), {
        dotColor: '#ffb6c1',
        lineColor: '#ff69b4',
        density: 12000
    });
});