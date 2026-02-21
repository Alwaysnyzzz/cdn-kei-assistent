document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'https://vercel-upload-jet.vercel.app/api'; // GANTI DENGAN URL VERCEL ANDA

    const urlParams = new URLSearchParams(window.location.search);
    const transactionId = urlParams.get('id');

    if (!transactionId) {
        alert('ID transaksi tidak ditemukan. Kembali ke donasi.');
        window.location.href = '../donasi.html';
        return;
    }

    const qrisImage = document.getElementById('qrisImage');
    const downloadQrisBtn = document.getElementById('downloadQrisBtn');
    const checkStatusBtn = document.getElementById('checkStatusBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const statusArea = document.getElementById('statusArea');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    const localLoading = document.getElementById('localLoading');
    const timerElement = document.getElementById('timer');
    const transactionIdSpan = document.getElementById('transactionId');

    if (transactionIdSpan) transactionIdSpan.textContent = transactionId;

    // Ambil data dari localStorage
    const storedData = localStorage.getItem(`lobbyQris_${transactionId}`);
    if (!storedData) {
        alert('Data transaksi tidak ditemukan. Kembali ke donasi.');
        window.location.href = '../donasi.html';
        return;
    }

    const transaction = JSON.parse(storedData);
    const amount = transaction.amount;
    const orderId = transaction.id;

    // Tampilkan QR
    qrisImage.src = transaction.qr_url;
    qrisImage.style.display = 'inline';
    downloadQrisBtn.dataset.qrUrl = transaction.qr_url;
    startTimer(transaction.expiry);

    function startTimer(expiryTimestamp) {
        const updateTimer = () => {
            const now = Date.now();
            const diff = expiryTimestamp - now;
            if (diff <= 0) {
                timerElement.textContent = 'Kadaluarsa';
                statusArea.innerHTML = '<p style="color:#ff69b4; text-align:center;">QRIS telah kadaluarsa. Silakan buat transaksi baru.</p>';
                checkStatusBtn.disabled = true;
                cancelBtn.disabled = true;
                downloadQrisBtn.disabled = true;
                localStorage.removeItem(`lobbyQris_${transactionId}`);
                return true;
            }
            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            return false;
        };

        updateTimer();
        const interval = setInterval(() => {
            if (updateTimer()) clearInterval(interval);
        }, 1000);
    }

    // Download QR
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

    // Cek status transaksi (tetap ke backend)
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
                                <p><strong>ID Transaksi:</strong> ${orderId}</p>
                                <p><strong>Jumlah:</strong> Rp ${amount.toLocaleString()}</p>
                                <p><strong>Status:</strong> Sukses</p>
                                <p><strong>Waktu:</strong> ${new Date().toLocaleString()}</p>
                            </div>
                        </div>
                    `;
                } else if (tx.status === 'pending' || tx.status === 'waiting') {
                    statusArea.innerHTML = `<p style="color:#ffccdd;">Pembayaran masih dalam antrian.</p>`;
                } else {
                    statusArea.innerHTML = `<p style="color:#ff69b4;">Status: ${tx.status}</p>`;
                }
            } else {
                statusArea.innerHTML = `<p style="color:#ff69b4;">Transaksi tidak ditemukan.</p>`;
            }
        } catch (err) {
            loadingOverlay.classList.remove('show');
            statusArea.innerHTML = `<p style="color:#ff69b4;">Error: ${err.message}</p>`;
        }
    });

    // Batalkan transaksi (hapus data localStorage)
    const cancelModal = document.getElementById('cancelModal');
    const confirmYes = document.getElementById('confirmCancelYes');
    const confirmNo = document.getElementById('confirmCancelNo');

    cancelBtn.addEventListener('click', () => cancelModal.classList.add('show'));

    confirmYes.addEventListener('click', () => {
        cancelModal.classList.remove('show');
        localStorage.removeItem(`lobbyQris_${transactionId}`);
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