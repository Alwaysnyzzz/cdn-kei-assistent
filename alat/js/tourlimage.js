document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    const fileName = document.getElementById('fileName');
    const uploadBtn = document.getElementById('uploadBtn');
    const loading = document.getElementById('loading');
    const modal = document.getElementById('uploadModal');
    const closeModal = document.getElementById('closeModal');
    const modalUploadBtn = document.getElementById('modalUploadBtn');

    const successModal = document.getElementById('successModal');
    const closeSuccessModal = document.getElementById('closeSuccessModal');
    const successUrl = document.getElementById('successUrl');
    const copySuccessBtn = document.getElementById('copySuccessBtn');

    let selectedFile = null;

    uploadArea.addEventListener('click', () => fileInput.click());
    modalUploadBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        fileInput.click();
    });

    fileInput.addEventListener('change', function(e) {
        selectedFile = e.target.files[0];
        if (selectedFile) {
            fileName.textContent = `📷 ${selectedFile.name} (${(selectedFile.size/1024).toFixed(2)} KB)`;
            uploadBtn.disabled = false;
        } else {
            fileName.textContent = 'Belum ada file dipilih';
            uploadBtn.disabled = true;
        }
    });

    uploadBtn.addEventListener('click', async function() {
        if (!selectedFile) return;

        loading.classList.add('show');
        uploadBtn.disabled = true;

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await fetch('https://vercel-upload-jet.vercel.app/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (response.ok && data.url) {
                successUrl.value = data.url;
                successModal.classList.add('show');
            } else {
                alert('Gagal upload: ' + (data.error || JSON.stringify(data)));
            }
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            loading.classList.remove('show');
            uploadBtn.disabled = false;
        }
    });

    copySuccessBtn.addEventListener('click', function() {
        successUrl.select();
        navigator.clipboard.writeText(successUrl.value);
        // alert dihapus
    });

    closeSuccessModal.addEventListener('click', () => successModal.classList.remove('show'));
    window.addEventListener('click', (e) => {
        if (e.target === successModal) successModal.classList.remove('show');
    });

    closeModal.addEventListener('click', () => modal.classList.remove('show'));
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('show');
    });
});