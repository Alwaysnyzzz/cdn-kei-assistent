document.addEventListener('DOMContentLoaded', function() {
    const config = window.WEBSITE_CONFIG || {};
    const API_BASE_URL = config.API_BASE_URL;

    const urlParams = new URLSearchParams(window.location.search);
    const transactionId = urlParams.get('id');

    if (!transactionId) {
        alert('ID transaksi tidak ditemukan');
        window.location.href = '../index.html';
        return;
    }

    fetch(`${API_BASE_URL}/transaction/${transactionId}`)
        .then(res => res.json())
        .then(data => {
            if (data.success && data.transaction) {
                const tx = data.transaction;
                const amount = tx.amount;
                const fee = Math.floor(amount * 0.007);
                const net = amount - fee;
                const waktu = new Date(tx.completed_at || tx.created_at).toLocaleString('id-ID');

                document.getElementById('strukContainer').innerHTML = `
                    <div class="struk-header">
                        <i class="fas fa-receipt"></i>
                        <h2>Struk Transaksi</h2>
                    </div>
                    <div class="struk-details">
                        <p><span class="label">ID Transaksi</span> <span class="value">${tx.id}</span></p>
                        <p><span class="label">Jumlah Donasi</span> <span class="value">Rp ${amount.toLocaleString()}</span></p>
                        <p><span class="label">Biaya Layanan</span> <span class="value">Rp ${fee.toLocaleString()}</span></p>
                        <p><span class="label">Total Diterima</span> <span class="value">Rp ${net.toLocaleString()}</span></p>
                        <p><span class="label">Metode</span> <span class="value">QRIS</span></p>
                        <p><span class="label">Status</span> <span class="value" style="color:#28a745;">Sukses</span></p>
                        <p><span class="label">Waktu</span> <span class="value">${waktu}</span></p>
                    </div>
                    <button class="btn-back-struk" id="backToHome">Kembali ke Beranda</button>
                `;
                document.getElementById('backToHome').addEventListener('click', () => {
                    window.location.href = '../index.html';
                });
            } else {
                alert('Transaksi tidak ditemukan');
                window.location.href = '../index.html';
            }
        })
        .catch(err => {
            console.error(err);
            alert('Gagal mengambil data transaksi');
            window.location.href = '../index.html';
        });

    particleground(document.getElementById('particles'), {
        dotColor: '#ffb6c1',
        lineColor: '#ff69b4',
        density: 12000
    });
});