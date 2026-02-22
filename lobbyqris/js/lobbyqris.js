document.addEventListener('DOMContentLoaded', function() {
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
    document.getElementById('checkStatusBtn').addEventListener('click', function() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.add('show');
        const statusArea = document.getElementById('statusArea');
        statusArea.innerHTML = '';

        // Ambil data terbaru dari localStorage
        const updatedData = JSON.parse(localStorage.getItem(`lobbyQris_${transactionId}`));
        if (!updatedData) {
            statusArea.innerHTML = '<p style="color:#ff69b4;">Data tidak ditemukan</p>';
            overlay.classList.remove('show');
            return;
        }

        overlay.classList.remove('show');

        if (updatedData.status === 'completed') {
            // Tampilkan struk
            const fee = Math.floor(amount * 0.007); // contoh fee 0.7%
            const net = amount - fee;
            const waktu = new Date(updatedData.completed_at || Date.now()).toLocaleString('id-ID');

            statusArea.innerHTML = `
                <div class="status-success">
                    <div class="success-circle animated-pulse">
                        <i class="fas fa-check"></i>
                    </div>
                    <h3>✅ Pembayaran Sukses!</h3>
                    <div class="transaction-details">
                        <p><strong>ID Transaksi:</strong> ${orderId}</p>
                        <p><strong>Jumlah:</strong> Rp ${amount.toLocaleString()}</p>
                        <p><strong>Fee:</strong> Rp ${fee.toLocaleString()}</p>
                        <p><strong>Saldo diterima:</strong> Rp ${net.toLocaleString()}</p>
                        <p><strong>Via:</strong> QRIS (Simulasi)</p>
                        <p><strong>Waktu:</strong> ${waktu}</p>
                    </div>
                    <button class="btn-struk" id="closeStruk">Tutup</button>
                </div>
            `;
            document.getElementById('closeStruk')?.addEventListener('click', () => {
                statusArea.innerHTML = '';
            });
        } else if (updatedData.status === 'pending') {
            statusArea.innerHTML = '<p style="color:#ffccdd;">⏳ Menunggu pembayaran</p>';
        } else {
            statusArea.innerHTML = `<p style="color:#ff69b4;">Status: ${updatedData.status}</p>`;
        }
    });

    // Simulasi Bayar
    document.getElementById('simulatePayBtn').addEventListener('click', function() {
        if (!confirm('Jalankan simulasi pembayaran? (Hanya untuk uji coba)')) return;

        const stored = localStorage.getItem(`lobbyQris_${transactionId}`);
        if (!stored) return;

        const data = JSON.parse(stored);
        data.status = 'completed';
        data.completed_at = new Date().toISOString();
        localStorage.setItem(`lobbyQris_${transactionId}`, JSON.stringify(data));

        alert('Simulasi berhasil! Status berubah menjadi completed.');
        // Panggil cek status untuk menampilkan struk
        document.getElementById('checkStatusBtn').click();
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

    // Inisialisasi particles (jika ada)
    if (typeof particleground !== 'undefined') {
        particleground(document.getElementById('particles'), {
            dotColor: '#ffb6c1',
            lineColor: '#ff69b4',
            density: 12000
        });
    }
});