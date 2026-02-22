document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const transactionId = urlParams.get('id');

    if (!transactionId) {
        alert('ID transaksi tidak ditemukan');
        window.location.href = '../index.html';
        return;
    }

    const stored = localStorage.getItem(`lobbyQris_${transactionId}`);
    if (!stored) {
        alert('Data transaksi tidak ditemukan');
        window.location.href = '../index.html';
        return;
    }

    const data = JSON.parse(stored);
    const amount = data.amount;
    const fee = Math.floor(amount * 0.007); // contoh fee 0.7%
    const net = amount - fee;
    const waktu = new Date(data.completed_at || data.created_at).toLocaleString('id-ID', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    // Format ID agar lebih rapi
    const shortId = data.id.length > 20 ? data.id.substring(0, 20) + '...' : data.id;

    const container = document.getElementById('strukContainer');
    container.innerHTML = `
        <div class="struk-header">
            <i class="fas fa-receipt"></i>
            <h2>Struk Transaksi</h2>
        </div>
        <div class="struk-details">
            <p><span class="label">ID Transaksi</span> <span class="value">${shortId}</span></p>
            <p><span class="label">Jumlah Donasi</span> <span class="value">Rp ${amount.toLocaleString()}</span></p>
            <p><span class="label">Biaya Layanan</span> <span class="value">Rp ${fee.toLocaleString()}</span></p>
            <p><span class="label">Total Diterima</span> <span class="value">Rp ${net.toLocaleString()}</span></p>
            <p><span class="label">Metode</span> <span class="value">QRIS (Simulasi)</span></p>
            <p><span class="label">Status</span> <span class="value" style="color: #28a745;">Sukses</span></p>
            <p><span class="label">Waktu</span> <span class="value">${waktu}</span></p>
        </div>
        <button class="btn-back-struk" id="backToHome">Kembali ke Beranda</button>
    `;

    document.getElementById('backToHome').addEventListener('click', function() {
        window.location.href = '../index.html';
    });

    particleground(document.getElementById('particles'), {
        dotColor: '#ffb6c1',
        lineColor: '#ff69b4',
        density: 12000
    });
});