document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'https://vercel-upload-jet.vercel.app/api'; // GANTI JIKA BERBEDA

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
    const orderId = data.order_id; // order_id asli dari Pakasir

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
            const res = await fetch(`${API_BASE_URL}/check-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, orderId })
            });
            const data = await res.json();
            overlay.classList.remove('show');

            if (res.ok && data.success) {
                const tx = data.transaction;
                if (tx.status === 'success' || tx.status === 'paid' || tx.status === 'completed') {
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
            statusArea.innerHTML = `<p style="color:#ff69b4;">Error: ${err.message}</p>`;
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

    // Tombol simulasi pembayaran (hanya untuk testing)
    document.getElementById('simulatePayBtn')?.addEventListener('click', async function() {
        if (!confirm('Jalankan simulasi pembayaran? (Hanya untuk testing)')) return;

        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.add('show');
        const statusArea = document.getElementById('statusArea');
        statusArea.innerHTML = '';

        try {
            const res = await fetch(`${API_BASE_URL}/simulate-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, amount })
            });
            const data = await res.json();
            overlay.classList.remove('show');

            if (res.ok && data.success) {
                alert('Simulasi berhasil! Status transaksi diubah menjadi completed.');
                // Panggil cek status otomatis
                document.getElementById('checkStatusBtn').click();
            } else {
                alert('Simulasi gagal: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            overlay.classList.remove('show');
            alert('Error: ' + err.message);
        }
    });

    particleground(document.getElementById('particles'), {
        dotColor: '#ffb6c1',
        lineColor: '#ff69b4',
        density: 12000
    });
});