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

        const updatedData = JSON.parse(localStorage.getItem(`lobbyQris_${transactionId}`));
        if (!updatedData) {
            statusArea.innerHTML = '<p style="color:#ff69b4;">Data tidak ditemukan</p>';
            overlay.classList.remove('show');
            return;
        }

        overlay.classList.remove('show');

        if (updatedData.status === 'completed') {
            statusArea.innerHTML = '<p style="color:#28a745;">✅ Status: Sukses</p>';
            // Tampilkan modal sukses
            showSuccessModal();
        } else if (updatedData.status === 'pending') {
            statusArea.innerHTML = '<p style="color:#ffccdd;">⏳ Status: Menunggu pembayaran</p>';
        } else {
            statusArea.innerHTML = `<p style="color:#ff69b4;">Status: ${updatedData.status}</p>`;
        }
    });

    // Simulasi Bayar (langsung sukses)
    document.getElementById('simulatePayBtn').addEventListener('click', function() {
        if (!confirm('Jalankan simulasi pembayaran? (Hanya untuk uji coba)')) return;

        const stored = localStorage.getItem(`lobbyQris_${transactionId}`);
        if (!stored) return;

        const data = JSON.parse(stored);
        data.status = 'completed';
        data.completed_at = new Date().toISOString();
        localStorage.setItem(`lobbyQris_${transactionId}`, JSON.stringify(data));

        // Tampilkan modal sukses
        showSuccessModal();
    });

    // Elemen modal sukses
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

    // Inisialisasi particles
    if (typeof particleground !== 'undefined') {
        particleground(document.getElementById('particles'), {
            dotColor: '#ffb6c1',
            lineColor: '#ff69b4',
            density: 12000
        });
    }
});