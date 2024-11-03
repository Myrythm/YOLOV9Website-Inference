const uploadSection = document.querySelector('.upload-section');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const resultCanvas = document.getElementById('resultCanvas');
const detectButton = document.getElementById('detectButton');
const loadingDiv = document.querySelector('.loading');
const resultsDiv = document.getElementById('results');

// Variable to store the uploaded file
let uploadedFile = null;

// Drag and drop handlers
uploadSection.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadSection.style.borderColor = '#4a90e2';
});

uploadSection.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadSection.style.borderColor = '#555';
});

uploadSection.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadSection.style.borderColor = '#555';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleImageUpload(file);
    }
});

// File input handler
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleImageUpload(file);
    }
});

function handleImageUpload(file) {
    uploadedFile = file;  // Store the uploaded file
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        imagePreview.style.display = 'block';
        resultCanvas.style.display = 'none';
        detectButton.disabled = false;
        resultsDiv.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

async function detectObjects() {
    if (!uploadedFile) {
        console.error('No image uploaded for detection');
        return;
    }

    loadingDiv.style.display = 'block';
    detectButton.disabled = true;

    try {
        const formData = new FormData();
        formData.append('image', uploadedFile);  // Use uploadedFile instead of imageInput.files[0]

        const response = await fetch('http://localhost:5000/detect', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Deteksi Gagal');
        }

        const result = await response.json();
        if (result.error) {
            throw new Error(result.error);
        }

        displayResults(result.detections);
        drawDetections(result.detections);
    } catch (error) {
        console.error('Deteksi Gagal:', error);
        resultsDiv.innerHTML = `Error ketika melakukan deteksi: ${error.message}`;
        resultsDiv.style.display = 'block';
    } finally {
        loadingDiv.style.display = 'none';
        detectButton.disabled = false;
    }
}

function displayResults(detections) {
    resultsDiv.innerHTML = '<h3>Hasil Deteksi:</h3>';
    detections.forEach(det => {
        resultsDiv.innerHTML += `<p>${det.label}: ${(det.confidence * 100).toFixed(2)}%</p>`;
    });
    resultsDiv.style.display = 'block';
}

function drawDetections(detections) {
    const ctx = resultCanvas.getContext('2d');
    resultCanvas.width = imagePreview.width;
    resultCanvas.height = imagePreview.height;

    // Menggambar gambar asli pada kanvas
    ctx.drawImage(imagePreview, 0, 0, resultCanvas.width, resultCanvas.height);

    // Hanya menampilkan label dan tingkat kepercayaan tanpa kotak
    detections.forEach(det => {
        const [x, y] = det.bbox; // Mengambil koordinat kiri atas

        // ctx.fillStyle = '#4a90e2';
        // ctx.font = '14px Poppins';
        // ctx.fillText(`${det.label} ${(det.confidence * 100).toFixed(2)}%`, x, y - 5);
    });

    imagePreview.style.display = 'none';
    resultCanvas.style.display = 'block';
}

// function drawDetections(detections) {
//     const ctx = resultCanvas.getContext('2d');
//     resultCanvas.width = imagePreview.width;
//     resultCanvas.height = imagePreview.height;

//     // Draw original image
//     ctx.drawImage(imagePreview, 0, 0, resultCanvas.width, resultCanvas.height);

//     // Draw detections
//     detections.forEach(det => {
//         const [x, y, width, height] = det.bbox;
//         ctx.strokeStyle = '#00ff00';
//         ctx.lineWidth = 2;
//         ctx.strokeRect(x, y, width - x, height - y);

//         // Draw label
//         ctx.fillStyle = '#00ff00';
//         ctx.font = '16px Arial';
//         ctx.fillText(
//             `${det.label} ${(det.confidence * 100).toFixed(2)}%`,
//             x,
//             y - 5
//         );
//     });

//     imagePreview.style.display = 'none';
//     resultCanvas.style.display = 'block';
// }