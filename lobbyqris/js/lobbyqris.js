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

    // Ambil data dari localStorage
    const lobbyData = JSON.parse(localStorage.getItem('lobbyQris'));
    if (!lobbyData || !lobbyData.amount || !lobbyData.orderId) {
        alert('Data tidak ditemukan. Kembali ke halaman donasi.');
        window.location.href = '../donasi.html';
        return;
    }

    const { amount, orderId } = lobbyData;

    // Tampilkan loading global
    loadingText.textContent = 'Sedang membuat QRIS, mohon tunggu...';
    loadingOverlay.classList.add('show');

    // Fungsi membuat QRIS
    async function createQris() {
        try {
            const response = await fetch(`${API_BASE_URL}/create-qris`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, orderId })
            });
            const data = await response.json();
            loadingOverlay.classList.remove('show');

            console.log('Response from API:', data);
            console.log('Payment number:', data.payment?.payment_number);

            if (response.ok && data.success) {
                const payment = data.payment;
                const qrString = payment.payment_number; // string data QRIS

                // Tampilkan loading lokal
                qrisImage.style.display = 'none';
                localLoading.style.display = 'flex';

                // Generate QR code dari string
                QRCode.toDataURL(qrString, { width: 300 }, function(err, url) {
                    if (err) {
                        console.error('Gagal generate QR:', err);
                        alert('Gagal membuat QR code');
                        window.location.href = '../donasi.html';
                        return;
                    }
                    // Tunggu 1,5 detik lalu tampilkan QR
                    setTimeout(() => {
                        localLoading.style.display = 'none';
                        qrisImage.src = url;
                        qrisImage.style.display = 'inline';
                        downloadQrisBtn.href = url;
                    }, 1500);
                });
            } else {
                alert('Gagal membuat QRIS: ' + (data.error || 'Unknown error'));
                window.location.href = '../donasi.html';
            }
        } catch (err) {
            loadingOverlay.classList.remove('show');
            alert('Error: ' + err.message);
            window.location.href = '../donasi.html';
        }
    }

    createQris();

    // Cek status (manual)
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

    cancelBtn.addEventListener('click', function() {
        if (confirm('Batalkan transaksi ini?')) {
            localStorage.removeItem('lobbyQris');
            window.location.href = '../donasi.html';
        }
    });

    particleground(document.getElementById('particles'), {
        dotColor: '#ffb6c1',
        lineColor: '#ff69b4',
        density: 12000
    });
});