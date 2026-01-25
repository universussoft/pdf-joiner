let pdfFiles = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // File input change handler
    document.getElementById('fileInput').addEventListener('change', handleFileSelect);
    
    // Drag and drop handlers
    const dropZone = document.getElementById('dropZone');
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files)
            .filter(file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
        
        if (files.length > 0) {
            addFiles(files);
        } else {
            alert('Please drop PDF files only');
        }
    });
});

// Handle file selection
function handleFileSelect(e) {
    addFiles(Array.from(e.target.files));
}

// Add files to the list
function addFiles(files) {
    files.forEach(file => {
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            alert(`"${file.name}" is not a PDF file. Skipping...`);
            return;
        }
        
        if (pdfFiles.some(pdf => pdf.name === file.name && pdf.size === file.size)) {
            alert(`"${file.name}" is already in the list`);
            return;
        }
        
        pdfFiles.push({
            file: file,
            name: file.name,
            size: formatFileSize(file.size)
        });
    });
    
    renderFileList();
    updateFileCount();
}

// Render file list
function renderFileList() {
    const filesList = document.getElementById('filesList');
    const filesSection = document.getElementById('filesSection');
    
    if (pdfFiles.length === 0) {
        filesSection.style.display = 'none';
        return;
    }
    
    filesSection.style.display = 'block';
    filesList.innerHTML = '';
    
    pdfFiles.forEach((pdf, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-info">
                <div class="file-name">${index + 1}. ${pdf.name}</div>
                <div class="file-size">${pdf.size}</div>
            </div>
            <div class="file-actions">
                <button onclick="moveFile(${index}, -1)" 
                        ${index === 0 ? 'disabled' : ''}
                        title="Move up">↑</button>
                <button onclick="moveFile(${index}, 1)" 
                        ${index === pdfFiles.length - 1 ? 'disabled' : ''}
                        title="Move down">↓</button>
                <button onclick="removeFile(${index})" 
                        class="remove-btn"
                        title="Remove">✕</button>
            </div>
        `;
        filesList.appendChild(fileItem);
    });
}

// Update file count display
function updateFileCount() {
    document.getElementById('fileCount').textContent = `(${pdfFiles.length})`;
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Remove a file
function removeFile(index) {
    pdfFiles.splice(index, 1);
    renderFileList();
    updateFileCount();
}

// Move file up or down
function moveFile(index, direction) {
    if (index + direction >= 0 && index + direction < pdfFiles.length) {
        [pdfFiles[index], pdfFiles[index + direction]] = [pdfFiles[index + direction], pdfFiles[index]];
        renderFileList();
    }
}

// Clear all files
function clearAll() {
    if (pdfFiles.length === 0) return;
    
    if (confirm('Are you sure you want to clear all files?')) {
        pdfFiles = [];
        document.getElementById('fileInput').value = '';
        renderFileList();
        updateFileCount();
    }
}

// Merge PDFs
async function mergePDFs() {
    if (pdfFiles.length < 2) {
        alert('Please select at least 2 PDF files to merge');
        return;
    }
    
    if (pdfFiles.length > 20) {
        alert('For performance reasons, please select no more than 20 PDF files at once');
        return;
    }
    
    // Show loading modal
    const modal = document.getElementById('loadingModal');
    const loadingText = document.getElementById('loadingText');
    modal.style.display = 'flex';
    
    try {
        loadingText.textContent = 'Initializing merge...';
        const mergedPdf = await PDFLib.PDFDocument.create();
        let totalPages = 0;
        
        // Process each PDF
        for (let i = 0; i < pdfFiles.length; i++) {
            const pdfInfo = pdfFiles[i];
            loadingText.textContent = `Processing: ${pdfInfo.name} (${i + 1}/${pdfFiles.length})...`;
            
            try {
                const arrayBuffer = await pdfInfo.file.arrayBuffer();
                const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
                const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                
                pages.forEach(page => mergedPdf.addPage(page));
                totalPages += pages.length;
                
            } catch (error) {
                console.error(`Error processing ${pdfInfo.name}:`, error);
                throw new Error(`Failed to process "${pdfInfo.name}". It may be corrupted or password protected.`);
            }
            
            // Add small delay to prevent blocking UI
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        loadingText.textContent = 'Finalizing merged document...';
        const mergedPdfBytes = await mergedPdf.save();
        
        // Create download
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `merged-${timestamp}.pdf`;
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        // Show success message
        loadingText.textContent = `✅ Successfully merged ${pdfFiles.length} PDFs (${totalPages} pages)!`;
        setTimeout(() => {
            modal.style.display = 'none';
        }, 2000);
        
    } catch (error) {
        modal.style.display = 'none';
        alert(`Error merging PDFs: ${error.message}`);
        console.error('Merge error:', error);
    }
}