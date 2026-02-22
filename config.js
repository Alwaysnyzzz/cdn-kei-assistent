// =====================================================
// KONFIGURASI WEBSITE – PRODUCTION (RISIKO: API KEY TERSEBAR)
// =====================================================

const WEBSITE_CONFIG = {
    // API Key Pakasir (RAHASIA! Jangan pernah simpan di frontend jika publik)
    // Untuk production, pastikan proyek di dashboard Pakasir sudah dalam mode Production.
    PAKASIR_API_KEY: 'jXWwWYZLB8iUoRXBKts0zfXQFhTj21kG',
    
    // Slug proyek
    PROJECT_SLUG: 'nyzz-store',
    
    // URL API Pakasir
    PAKASIR_API_URL: 'https://app.pakasir.com/api',
    
    // Minimal donasi
    MIN_DONATION: 500,
    
    // Flag production: true = sembunyikan tombol simulasi, gunakan uang asli
    IS_PRODUCTION: true,
    
    // Tampilan
    APP_NAME: 'KEI ASSISTENT',
    THEME_COLOR: '#ff69b4'
};

window.WEBSITE_CONFIG = WEBSITE_CONFIG;