document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    const fileName = document.getElementById('fileName');
    const uploadBtn = document.getElementById('uploadBtn');
    const loading = document.getElementById('loading');
    const resultArea = document.getElementById('resultArea');
    const fileUrl = document.getElementById('fileUrl');
    const copyBtn = document.getElementById('copyBtn');
    const modal = document.getElementById('uploadModal');
    const closeModal = document.getElementById('closeModal');
    const modalUploadBtn = document.getElementById('modalUploadBtn');

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
        resultArea.style.display = 'none';
        uploadBtn.disabled = true;

        const formData = new FormData();
        formData.append('fileToUpload', selectedFile);
        formData.append('reqtype', 'fileupload');
        formData.append('userhash', '');

        try {
            const response = await fetch('https://catbox.moe/user/api.php', {
                method: 'POST',
                body: formData
            });
            const link = await response.text();

            if (link && link.startsWith('https://')) {
                fileUrl.value = link;
                resultArea.style.display = 'block';
                // Simpan ke localStorage (opsional)
                let history = JSON.parse(localStorage.getItem('tourlHistory') || '[]');
                history.push({ file: selectedFile.name, url: link, time: new Date().toISOString() });
                localStorage.setItem('tourlHistory', JSON.stringify(history));
            } else {
                alert('Gagal upload: ' + link);
            }
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            loading.classList.remove('show');
            uploadBtn.disabled = false;
        }
    });

    copyBtn.addEventListener('click', function() {
        fileUrl.select();
        navigator.clipboard.writeText(fileUrl.value).then(() => {
            alert('Link disalin!');
        });
    });

    closeModal.addEventListener('click', () => modal.classList.remove('show'));
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('show');
    });
});