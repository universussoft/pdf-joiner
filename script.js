let pdfFiles = [];
let isDarkTheme = true; // Default to dark theme

// Initialize theme
function initTheme() {
    const savedTheme = localStorage.getItem('pdfJoinerTheme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        isDarkTheme = false;
        updateThemeIcon();
    }
}

// Toggle theme
function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    
    if (isDarkTheme) {
        document.body.classList.remove('light-theme');
        localStorage.setItem('pdfJoinerTheme', 'dark');
    } else {
        document.body.classList.add('light-theme');
        localStorage.setItem('pdfJoinerTheme', 'light');
    }
    
    updateThemeIcon();
}

// Update theme icon
function updateThemeIcon() {
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = isDarkTheme ? '🌙' : '☀️';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    
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
            showMessage('Please drop PDF files only', 'error');
        }
    });
    
    // Donation modal close on outside click
    document.getElementById('donationModal').addEventListener('click', (e) => {
        if (e.target.id === 'donationModal') {
            closeDonationModal();
        }
    });
});

// Handle file selection
function handleFileSelect(e) {
    addFiles(Array.from(e.target.files));
}

// Add files to the list
function addFiles(files) {
    let addedCount = 0;
    
    files.forEach(file => {
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            showMessage(`"${file.name}" is not a PDF file. Skipping...`, 'warning');
            return;
        }
        
        if (pdfFiles.some(pdf => pdf.name === file.name && pdf.size === file.size)) {
            showMessage(`"${file.name}" is already in the list`, 'info');
            return;
        }
        
        if (file.size > 100 * 1024 * 1024) { // 100MB limit
            showMessage(`"${file.name}" is too large (max 100MB)`, 'error');
            return;
        }
        
        pdfFiles.push({
            file: file,
            name: file.name,
            size: formatFileSize(file.size),
            date: new Date().toISOString()
        });
        addedCount++;
    });
    
    if (addedCount > 0) {
        renderFileList();
        updateFileCount();
        showMessage(`${addedCount} file(s) added`, 'success');
    }
}

// Show message
function showMessage(text, type = 'info') {
    // Create message element
    const message = document.createElement('div');
    message.className = `message message-${type}`;
    message.textContent = text;
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    `;
    
    // Set colors based on type
    const colors = {
        success: '#2ecc71',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    
    message.style.background = colors[type] || colors.info;
    
    document.body.appendChild(message);
    
    // Remove after 3 seconds
    setTimeout(() => {
        message.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (message.parentNode) {
                document.body.removeChild(message);
            }
        }, 300);
    }, 3000);
    
    // Add CSS animations
    if (!document.querySelector('#message-styles')) {
        const style = document.createElement('style');
        style.id = 'message-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
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
    const fileName = pdfFiles[index].name;
    pdfFiles.splice(index, 1);
    renderFileList();
    updateFileCount();
    showMessage(`"${fileName}" removed`, 'info');
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
        const count = pdfFiles.length;
        pdfFiles = [];
        document.getElementById('fileInput').value = '';
        renderFileList();
        updateFileCount();
        showMessage(`${count} file(s) cleared`, 'info');
    }
}

// Merge PDFs
async function mergePDFs() {
    if (pdfFiles.length < 2) {
        showMessage('Please select at least 2 PDF files to merge', 'warning');
        return;
    }
    
    if (pdfFiles.length > 20) {
        showMessage('For performance reasons, please select no more than 20 PDF files at once', 'warning');
        return;
    }
    
    // Calculate total size
    const totalSize = pdfFiles.reduce((sum, pdf) => sum + pdf.file.size, 0);
    if (totalSize > 200 * 1024 * 1024) { // 200MB total limit
        showMessage('Total file size exceeds 200MB. Please reduce the number of files.', 'error');
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
        let processedFiles = 0;
        
        // Process each PDF
        for (let i = 0; i < pdfFiles.length; i++) {
            const pdfInfo = pdfFiles[i];
            processedFiles++;
            loadingText.textContent = `Processing: ${pdfInfo.name} (${processedFiles}/${pdfFiles.length})...`;
            
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
            if (i < pdfFiles.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
        
        loadingText.textContent = 'Finalizing merged document...';
        const mergedPdfBytes = await mergedPdf.save();
        
        // Create download
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toLocaleDateString('en-US').replace(/\//g, '-');
        const filename = `merged-pdf-${timestamp}.pdf`;
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        // Show success message
        loadingText.textContent = `✅ Success! ${pdfFiles.length} PDFs merged (${totalPages} pages)!`;
        showMessage(`PDF created successfully! ${totalPages} pages`, 'success');
        
        setTimeout(() => {
            modal.style.display = 'none';
        }, 2000);
        
    } catch (error) {
        modal.style.display = 'none';
        showMessage(`Error: ${error.message}`, 'error');
        console.error('Error merging PDFs:', error);
    }
}

// Donation modal functions
function showDonationModal() {
    document.getElementById('donationModal').style.display = 'flex';
}

function closeDonationModal() {
    document.getElementById('donationModal').style.display = 'none';
}