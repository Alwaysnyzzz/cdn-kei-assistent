document.addEventListener('DOMContentLoaded', function() {
    // ===== KONFIGURASI =====
    const API_BASE_URL = 'https://vercel-upload-jet.vercel.app/api';

    // ===== ELEMEN DOM =====
    const amountInput = document.getElementById('amount');
    const payBtn = document.getElementById('payBtn');
    const qrisModal = document.getElementById('qrisModal');
    const closeQrisModal = document.getElementById('closeQrisModal');
    const qrisImage = document.getElementById('qrisImage');
    const downloadQrisBtn = document.getElementById('downloadQrisBtn');
    const checkStatusBtn = document.getElementById('checkStatusBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const statusArea = document.getElementById('statusArea');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // Tombol nominal cepat
    const quickAmountBtns = document.querySelectorAll('.quick-amount-btn');
    const customAmountToggle = document.getElementById('customAmountToggle');
    const customAmountDropdown = document.getElementById('customAmountDropdown');
    const customAmountInput = document.getElementById('customAmountInput');
    const applyCustomAmount = document.getElementById('applyCustomAmount');

    // State
    let currentAmount = 10000; // default
    let currentOrderId = '';
    let currentTransactionId = '';
    let statusCheckInterval = null;

    // ===== FUNGSI BANTU =====
    function generateOrderId() {
        const prefix = 'DON';
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${prefix}-${timestamp}${random}`;
    }

    function validateAmount(amount) {
        const minAmount = 230;
        if (isNaN(amount) || amount < minAmount) {
            alert(`Maaf, minimal transaksi adalah Rp ${minAmount.toLocaleString()}`);
            return false;
        }
        return true;
    }

    function clearStatusCheck() {
        if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
            statusCheckInterval = null;
        }
    }

    // ===== TOMBOL NOMINAL CEPAT =====
    quickAmountBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            quickAmountBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentAmount = parseInt(this.dataset.amount);
            amountInput.value = currentAmount;
            customAmountDropdown.classList.remove('show');
        });
    });

    // ===== DROPDOWN INPUT MANUAL =====
    customAmountToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        customAmountDropdown.classList.toggle('show');
    });

    document.addEventListener('click', function(e) {
        if (!customAmountToggle.contains(e.target) && !customAmountDropdown.contains(e.target)) {
            customAmountDropdown.classList.remove('show');
        }
    });

    applyCustomAmount.addEventListener('click', function() {
        const customAmount = parseInt(customAmountInput.value);
        if (validateAmount(customAmount)) {
            currentAmount = customAmount;
            amountInput.value = customAmount;
            quickAmountBtns.forEach(b => b.classList.remove('active'));
            customAmountDropdown.classList.remove('show');
        }
    });

    customAmountInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            applyCustomAmount.click();
        }
    });

    // ===== TOMBOL BUAT QRIS =====
    payBtn.addEventListener('click', async function(e) {
        e.preventDefault();

        let amount = parseInt(amountInput.value);
        if (!validateAmount(amount)) return;

        payBtn.disabled = true;
        payBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

        const orderId = generateOrderId();
        currentOrderId = orderId;

        try {
            const response = await fetch(`${API_BASE_URL}/create-qris`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, orderId })
            });
            const data = await response.json();

            if (response.ok && data.success) {
                const payment = data.payment;
                qrisImage.src = payment.qr_url;
                downloadQrisBtn.href = payment.qr_url;
                currentTransactionId = payment.id || orderId;
                qrisModal.classList.add('show');
                statusArea.innerHTML = ''; // reset status
                checkStatusBtn.disabled = false;
                cancelBtn.disabled = false;
                // Mulai polling status setiap 5 detik
                statusCheckInterval = setInterval(() => {
                    checkTransactionStatus();
                }, 5000);
            } else {
                alert('Gagal membuat QRIS: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            payBtn.disabled = false;
            payBtn.innerHTML = '<i class="fas fa-qrcode"></i> Buat QRIS';
        }
    });

    // ===== CEK STATUS TRANSAKSI =====
    async function checkTransactionStatus() {
        loadingOverlay.classList.add('show');
        statusArea.innerHTML = '';

        try {
            const response = await fetch(`${API_BASE_URL}/check-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: currentAmount, orderId: currentOrderId })
            });
            const data = await response.json();

            loadingOverlay.classList.remove('show');

            if (response.ok && data.success) {
                const tx = data.transaction;
                // Asumsikan status ada di tx.status
                if (tx.status === 'success' || tx.status === 'paid') {
                    // Sukses
                    statusArea.innerHTML = `
                        <div class="status-success">
                            <div class="success-circle animated-pulse">
                                <i class="fas fa-check"></i>
                            </div>
                            <h3>Pembayaran Sukses!</h3>
                            <div class="transaction-details">
                                <p><strong>Status:</strong> <span style="color: #28a745;">Sukses ✅</span></p>
                                <p><strong>Jumlah:</strong> Rp ${tx.amount?.toLocaleString() || currentAmount.toLocaleString()}</p>
                                <p><strong>Fee:</strong> Rp ${tx.fee?.toLocaleString() || '1.400'}</p>
                                <p><strong>Saldo diterima:</strong> Rp ${tx.net?.toLocaleString() || (currentAmount - 1400).toLocaleString()}</p>
                                <p><strong>Via:</strong> QRIS</p>
                                <p><strong>Order ID:</strong> ${tx.order_id || currentOrderId}</p>
                            </div>
                            <button class="btn-struk" id="viewReceiptBtn">Lihat Struk</button>
                        </div>
                    `;
                    // Simpan ke riwayat (localStorage sementara)
                    saveToHistory({ ...tx, amount: currentAmount, orderId: currentOrderId });
                    clearStatusCheck();
                    checkStatusBtn.disabled = true;
                    cancelBtn.disabled = true;
                } else if (tx.status === 'pending' || tx.status === 'waiting') {
                    // Masih pending
                    statusArea.innerHTML = `
                        <div style="text-align:center; color:#ffccdd;">
                            <p>Pembayaran masih dalam antrian.</p>
                            <p>Silakan scan QRIS dan lakukan pembayaran.</p>
                        </div>
                    `;
                } else {
                    // Gagal atau expired
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
                // Error dari server
                statusArea.innerHTML = `
                    <div class="status-failed">
                        <p>Error: ${data.error || 'Gagal cek status'}</p>
                    </div>
                `;
            }
        } catch (err) {
            loadingOverlay.classList.remove('show');
            statusArea.innerHTML = `<div class="status-failed"><p>Error: ${err.message}</p></div>`;
        }
    }

    // ===== SIMULASI SIMPAN RIWAYAT (localStorage) =====
    function saveToHistory(transaction) {
        let history = JSON.parse(localStorage.getItem('donasiHistory') || '[]');
        history.push({
            orderId: transaction.orderId,
            amount: transaction.amount,
            status: 'success',
            time: new Date().toISOString()
        });
        localStorage.setItem('donasiHistory', JSON.stringify(history));
        console.log('Riwayat tersimpan:', history);
    }

    // ===== TOMBOL CEK STATUS =====
    checkStatusBtn.addEventListener('click', function() {
        checkTransactionStatus();
    });

    // ===== TOMBOL BATALKAN =====
    cancelBtn.addEventListener('click', function() {
        if (confirm('Batalkan transaksi ini?')) {
            qrisModal.classList.remove('show');
            clearStatusCheck();
            statusArea.innerHTML = '';
        }
    });

    // ===== TUTUP MODAL =====
    closeQrisModal.addEventListener('click', () => {
        qrisModal.classList.remove('show');
        clearStatusCheck();
    });
    window.addEventListener('click', (e) => {
        if (e.target === qrisModal) {
            qrisModal.classList.remove('show');
            clearStatusCheck();
        }
    });

    // ===== INISIALISASI PARTICLES =====
    particleground(document.getElementById('particles'), {
        dotColor: '#ffb6c1',
        lineColor: '#ff69b4',
        density: 12000
    });
});