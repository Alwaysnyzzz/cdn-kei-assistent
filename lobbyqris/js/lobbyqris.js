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
            const sec = Math.floor((diff % 60000) / 1000);
            timer.textContent = `${min.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
            return false;
        };
        update();
        setInterval(update, 1000);
    }
    startTimer(data.expiry);

    document.getElementById('downloadQrisBtn').addEventListener('click', async function() {
        const url = this.dataset.qrUrl;
        if (!url) return;
        const blob = await fetch(url).then(r => r.blob());
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'qris.png';
        a.click();
    });

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
                if (tx.status === 'success' || tx.status === 'paid') {
                    document.getElementById('statusArea').innerHTML = '<p style="color:#28a745;">✅ Pembayaran sukses</p>';
                } else if (tx.status === 'pending' || tx.status === 'waiting') {
                    document.getElementById('statusArea').innerHTML = '<p style="color:#ffccdd;">⏳ Menunggu pembayaran</p>';
                } else {
                    document.getElementById('statusArea').innerHTML = '<p style="color:#ff69b4;">❌ Gagal</p>';
                }
            } else {
                document.getElementById('statusArea').innerHTML = '<p style="color:#ff69b4;">Transaksi tidak ditemukan</p>';
            }
        } catch (err) {
            overlay.classList.remove('show');
            document.getElementById('statusArea').innerHTML = `<p style="color:#ff69b4;">Error: ${err.message}</p>`;
        }
    });

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

    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('cancelModal')) {
            document.getElementById('cancelModal').classList.remove('show');
        }
    });

    if (typeof particleground !== 'undefined') {
        particleground(document.getElementById('particles'), {
            dotColor: '#ffb6c1',
            lineColor: '#ff69b4',
            density: 12000
        });
    }
});