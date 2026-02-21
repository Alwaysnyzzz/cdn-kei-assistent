document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'https://vercel-upload-jet.vercel.app/api';

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

    document.getElementById('qrisImage').src = data.qr_url;
    document.getElementById('qrisImage').style.display = 'inline';
    document.getElementById('downloadQrisBtn').dataset.qrUrl = data.qr_url;
    document.getElementById('transactionId').textContent = transactionId;

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

    // Download
    document.getElementById('downloadQrisBtn').addEventListener('click', async function() {
        const url = this.dataset.qrUrl;
        if (!url) return;
        const blob = await fetch(url).then(r => r.blob());
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'qris.png';
        a.click();
    });

    // Cek status
    document.getElementById('checkStatusBtn').addEventListener('click', async function() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.add('show');
        document.getElementById('statusArea').innerHTML = '';

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
                if (tx.status === 'success') {
                    document.getElementById('statusArea').innerHTML = '<p>✅ Sukses</p>';
                } else if (tx.status === 'pending') {
                    document.getElementById('statusArea').innerHTML = '<p>⏳ Menunggu</p>';
                } else {
                    document.getElementById('statusArea').innerHTML = '<p>❌ Gagal</p>';
                }
            } else {
                document.getElementById('statusArea').innerHTML = '<p>Transaksi tidak ditemukan</p>';
            }
        } catch (err) {
            overlay.classList.remove('show');
            alert(err.message);
        }
    });

    // Batalkan
    document.getElementById('cancelBtn').addEventListener('click', function() {
        document.getElementById('cancelModal').classList.add('show');
    });
    document.getElementById('confirmCancelYes').addEventListener('click', function() {
        localStorage.removeItem(`lobbyQris_${transactionId}`);
        window.location.href = '../donasi.html';
    });
    document.getElementById('confirmCancelNo').addEventListener('click', function() {
        document.getElementById('cancelModal').classList.remove('show');
    });

    particleground(document.getElementById('particles'), {
        dotColor: '#ffb6c1',
        lineColor: '#ff69b4',
        density: 12000
    });
});