// =====================================================
// KONFIGURASI WEBSITE – PRODUCTION (PAKAI BACKEND PXXL)
// =====================================================

const WEBSITE_CONFIG = {
    // URL backend Anda di Pxxl (ganti jika berbeda)
    API_BASE_URL: 'https://donasi-backend.pxxl.click/api',
    
    // Minimal donasi
    MIN_DONATION: 500,
    
    // Mode production (true = sembunyikan tombol simulasi)
    IS_PRODUCTION: true,
    
    // Tampilan (opsional)
    APP_NAME: 'KEI ASSISTENT',
    THEME_COLOR: '#ff69b4'
};

window.WEBSITE_CONFIG = WEBSITE_CONFIG;