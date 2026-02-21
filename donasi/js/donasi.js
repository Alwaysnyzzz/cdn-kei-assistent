document.addEventListener('DOMContentLoaded', function() {
    const quickAmountBtns = document.querySelectorAll('.quick-amount-btn');
    const payBtn = document.getElementById('payBtn');
    const selectedAmountDisplay = document.getElementById('selectedAmountDisplay');
    const selectedAmountText = document.getElementById('selectedAmountText');
    let selectedAmount = null;
    let selectedOrderId = null;

    // Cek apakah ada data pending dari halaman nominal
    const pendingData = localStorage.getItem('pendingNominal');
    if (pendingData) {
        const data = JSON.parse(pendingData);
        selectedAmount = data.amount;
        selectedOrderId = data.orderId;
        // Tampilkan info nominal
        selectedAmountText.textContent = `Rp ${selectedAmount.toLocaleString()}`;
        selectedAmountDisplay.style.display = 'block';
        payBtn.disabled = false;
        localStorage.removeItem('pendingNominal');
        // Hapus class active dari semua tombol cepat
        quickAmountBtns.forEach(b => b.classList.remove('active'));
    }

    quickAmountBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Hapus class active dari semua tombol
            quickAmountBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            selectedAmount = parseInt(this.dataset.amount);
            selectedOrderId = generateOrderId();
            // Tampilkan info nominal
            selectedAmountText.textContent = `Rp ${selectedAmount.toLocaleString()}`;
            selectedAmountDisplay.style.display = 'block';
            payBtn.disabled = false;
        });
    });

    payBtn.addEventListener('click', function() {
        if (selectedAmount && selectedOrderId) {
            localStorage.setItem('lobbyQris', JSON.stringify({
                amount: selectedAmount,
                orderId: selectedOrderId
            }));
            window.location.href = 'lobbyqris/lobbyqris.html';
        }
    });

    function generateOrderId() {
        const prefix = 'DON';
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${prefix}-${timestamp}${random}`;
    }

    // Inisialisasi particles
    particleground(document.getElementById('particles'), {
        dotColor: '#ffb6c1',
        lineColor: '#ff69b4',
        density: 12000
    });
});