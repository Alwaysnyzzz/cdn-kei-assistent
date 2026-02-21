document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const errorCode = urlParams.get('code') || 'Terjadi kesalahan tidak diketahui';
    
    document.getElementById('errorMessage').textContent = 'Silakan refresh halaman atau coba lagi nanti.';
    document.getElementById('errorCode').textContent = `Kode error: ${errorCode}`;

    particleground(document.getElementById('particles'), {
        dotColor: '#ffb6c1',
        lineColor: '#ff69b4',
        density: 12000
    });
});