// donasi/config.js (frontend)
// Konfigurasi publik untuk fitur donasi
const DONASI_CONFIG = {
    // Slug proyek dari dashboard Pakasir (publik)
    PROJECT_SLUG: 'nyzz-store',
    
    // Mode test: true = sandbox (hanya untuk uji coba), false = production
    // Mode ini hanya mempengaruhi tampilan/pesan, bukan API
    IS_TEST_MODE: false,
    
    // URL API backend (Vercel) – publik
    API_BASE_URL: 'https://vercel-upload-jet.vercel.app/api'
};

// Jika diperlukan, bisa juga diekspor sebagai global
window.DONASI_CONFIG = DONASI_CONFIG;