document.addEventListener('DOMContentLoaded', function() {
    const config = window.WEBSITE_CONFIG || {};
    const API_KEY = config.API_KEY;
    const PROJECT_SLUG = config.PROJECT_SLUG;
    const PAKASIR_API_URL = config.PAKASIR_API_URL;

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
    const orderId = data.order_id;

    // Tampilkan QR
    const qrisImage = document.getElementById('qrisImage');
    qrisImage.src = data.qr_url;
    qrisImage.style.display = 'inline';
    document.getElementById('downloadQrisBtn').dataset.qrUrl = data.qr_url;
    document.getElementById('transactionId').textContent = transactionId;

    // Timer
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

    // Download QR
    document.getElementById('downloadQrisBtn').addEventListener('click', async function() {
        const url = this.dataset.qrUrl;
        if (!url) return;
        const blob = await fetch(url).then(r => r.blob());
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'qris.png';
        a.click();
    });

    // Cek Status
    document.getElementById('checkStatusBtn').addEventListener('click', async function() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.add('show');
        const statusArea = document.getElementById('statusArea');
        statusArea.innerHTML = '';

        try {
            const url = `${PAKASIR_API_URL}/transactiondetail?project=${PROJECT_SLUG}&amount=${amount}&order_id=${orderId}&api_key=${API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();
            overlay.classList.remove('show');

            if (data.transaction) {
                const tx = data.transaction;
                if (tx.status === 'completed' || tx.status === 'paid' || tx.status === 'success') {
                    statusArea.innerHTML = '<p style="color:#28a745;">✅ Pembayaran sukses</p>';
                } else if (tx.status === 'pending' || tx.status === 'waiting') {
                    statusArea.innerHTML = '<p style="color:#ffccdd;">⏳ Menunggu pembayaran</p>';
                } else {
                    statusArea.innerHTML = `<p style="color:#ff69b4;">❌ Gagal (${tx.status})</p>`;
                }
            } else {
                statusArea.innerHTML = '<p style="color:#ff69b4;">Transaksi tidak ditemukan</p>';
            }
        } catch (err) {
            overlay.classList.remove('show');
            console.error(err);
            if (err.message.includes('Failed to fetch')) {
                alert('Gagal menghubungi API Pakasir. Kemungkinan karena CORS.');
            } else {
                alert('Error: ' + err.message);
            }
        }
    });

    // Batalkan transaksi
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
});