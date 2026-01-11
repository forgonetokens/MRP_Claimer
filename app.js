// IATSE MRP Claim Form Generator
// Main Application JavaScript

const { PDFDocument, rgb, StandardFonts } = PDFLib;

// Form Field Coordinates (raw visual coordinates, top-left origin)
// Conversion formula: pdf_x = raw_x + 38, pdf_y = (792 - raw_y) + 28
const CROP_HEIGHT = 792;
const CROP_OFFSET_X = 38;
const CROP_OFFSET_Y = 28;

function toPdfX(rawX) { return rawX + CROP_OFFSET_X; }
function toPdfY(rawY) { return (CROP_HEIGHT - rawY) + CROP_OFFSET_Y; }

// Form field definitions (raw visual coordinates from alignment tool)
const FORM_FIELDS = {
    // Page 1 - Participant Information
    participant_last_name: { page: 1, x: 164, y: 405, fontSize: 11 },
    participant_first_name: { page: 1, x: 321, y: 405, fontSize: 11 },
    participant_mi: { page: 1, x: 497, y: 405, fontSize: 11 },
    ssn: { page: 1, x: 177, y: 432, fontSize: 11 },
    gender_male: { page: 1, x: 424, y: 433, type: 'checkbox' },
    gender_female: { page: 1, x: 502.5, y: 433, type: 'checkbox' },

    // Page 1 - Date of Birth
    dob_month: { page: 1, x: 164, y: 460, fontSize: 11 },
    dob_day: { page: 1, x: 257, y: 460, fontSize: 11 },
    dob_year: { page: 1, x: 347, y: 460, fontSize: 11 },

    // Page 1 - Address
    street: { page: 1, x: 104, y: 488, fontSize: 10 },
    city: { page: 1, x: 316, y: 488, fontSize: 10 },
    state: { page: 1, x: 451, y: 488, fontSize: 10 },
    zip: { page: 1, x: 486, y: 488, fontSize: 10 },

    // Page 1 - Contact
    phone: { page: 1, x: 129, y: 516, fontSize: 10 },
    email: { page: 1, x: 327, y: 516, fontSize: 9 },
    other_coverage: { page: 1, x: 257, y: 544, fontSize: 10 },

    // Page 1 - Patient Information
    patient_last_name: { page: 1, x: 129, y: 571, fontSize: 11 },
    patient_first_name: { page: 1, x: 303, y: 571, fontSize: 11 },
    patient_mi: { page: 1, x: 503.5, y: 571, fontSize: 11 },
    patient_relationship: { page: 1, x: 192, y: 605, fontSize: 11 },

    // Page 1 - Patient DOB
    patient_dob_month: { page: 1, x: 164, y: 629, fontSize: 11 },
    patient_dob_day: { page: 1, x: 263, y: 629, fontSize: 11 },
    patient_dob_year: { page: 1, x: 343, y: 629, fontSize: 11 },

    // Page 2 - Expense Table (8 rows, ~18px apart)
    expense_1: { provider_x: 46, date_x: 280, amount_x: 447, y: 124, fontSize: 9 },
    expense_2: { provider_x: 46, date_x: 280, amount_x: 447, y: 142, fontSize: 9 },
    expense_3: { provider_x: 46, date_x: 280, amount_x: 447, y: 160, fontSize: 9 },
    expense_4: { provider_x: 46, date_x: 280, amount_x: 447, y: 178, fontSize: 9 },
    expense_5: { provider_x: 46, date_x: 280, amount_x: 447, y: 196, fontSize: 9 },
    expense_6: { provider_x: 46, date_x: 280, amount_x: 447, y: 214, fontSize: 9 },
    expense_7: { provider_x: 46, date_x: 280, amount_x: 447, y: 232, fontSize: 9 },
    expense_8: { provider_x: 46, date_x: 280, amount_x: 447, y: 250, fontSize: 9 },

    // Page 2 - Totals and Checkboxes
    total_amount: { page: 2, x: 447, y: 290, fontSize: 11 },
    dental_yes: { page: 2, x: 275, y: 325, type: 'checkbox' },
    dental_no: { page: 2, x: 316, y: 324, type: 'checkbox' },
    vision_yes: { page: 2, x: 449, y: 323, type: 'checkbox' },
    vision_no: { page: 2, x: 497, y: 324, type: 'checkbox' },

    // Page 2 - Signature
    signature_date: { page: 2, x: 449, y: 640, fontSize: 10 },
    signature_image: { page: 2, x: 100, y: 640, width: 200, height: 50 }
};

// DOM Elements
const form = document.getElementById('claimForm');
const signatureCanvas = document.getElementById('signaturePad');
let signaturePad;

// Uploaded files storage
let uploadedFiles = [];

// Profile field IDs (for localStorage)
const profileFields = [
    'participantLastName', 'participantFirstName', 'participantMI',
    'participantID', 'dobMonth', 'dobDay', 'dobYear',
    'street', 'city', 'state', 'zip',
    'telephone', 'email', 'otherCoverage'
];

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initSignaturePad();
    initExpenseRows();
    initEventListeners();
    loadProfileIfExists();
    setDefaultDate();
});

// Initialize Signature Pad
function initSignaturePad() {
    signaturePad = new SignaturePad(signatureCanvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)'
    });

    // Resize canvas to fit container
    function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const rect = signatureCanvas.getBoundingClientRect();
        signatureCanvas.width = rect.width * ratio;
        signatureCanvas.height = rect.height * ratio;
        signatureCanvas.getContext('2d').scale(ratio, ratio);
        signaturePad.clear();
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    document.getElementById('clearSignature').addEventListener('click', () => {
        signaturePad.clear();
    });
}

// Initialize expense rows
function initExpenseRows() {
    addExpenseRow(); // Start with one row
}

// Add expense row
function addExpenseRow() {
    const container = document.getElementById('expenseRows');
    const rowIndex = container.children.length;

    const row = document.createElement('div');
    row.className = 'expense-row';
    row.innerHTML = `
        <input type="text" name="provider_${rowIndex}" placeholder="Provider name">
        <input type="text" name="dates_${rowIndex}" placeholder="MM/DD/YYYY - MM/DD/YYYY">
        <input type="text" name="amount_${rowIndex}" placeholder="$0.00" class="amount-input">
        <button type="button" class="remove-row" title="Remove row">&times;</button>
    `;

    container.appendChild(row);

    // Add event listeners
    const amountInput = row.querySelector('.amount-input');
    amountInput.addEventListener('input', handleAmountInput);
    amountInput.addEventListener('blur', formatAmountOnBlur);

    row.querySelector('.remove-row').addEventListener('click', () => {
        if (container.children.length > 1) {
            row.remove();
            updateTotal();
        }
    });
}

// Handle amount input - allow only numbers and decimal
function handleAmountInput(e) {
    let value = e.target.value.replace(/[^\d.]/g, '');

    // Handle multiple decimals
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }

    e.target.value = value;
    updateTotal();
}

// Format amount on blur
function formatAmountOnBlur(e) {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
        e.target.value = value.toFixed(2);
    } else {
        e.target.value = '';
    }
    updateTotal();
}

// Update total amount
function updateTotal() {
    const amounts = document.querySelectorAll('.amount-input');
    let total = 0;

    amounts.forEach(input => {
        const value = parseFloat(input.value);
        if (!isNaN(value)) {
            total += value;
        }
    });

    document.getElementById('totalAmount').textContent = `$${total.toFixed(2)}`;
}

// Initialize all event listeners
function initEventListeners() {
    // Add row button
    document.getElementById('addRow').addEventListener('click', addExpenseRow);

    // Same as participant checkbox
    document.getElementById('sameAsParticipant').addEventListener('change', handleSameAsParticipant);

    // Profile management
    document.getElementById('saveProfile').addEventListener('click', saveProfile);
    document.getElementById('loadProfile').addEventListener('click', () => loadProfile(true));
    document.getElementById('exportProfile').addEventListener('click', exportProfile);
    document.getElementById('importProfile').addEventListener('change', importProfile);

    // File upload
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('receiptUpload');

    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    // Generate buttons
    document.getElementById('generatePDF').addEventListener('click', () => generatePDF(false));
    document.getElementById('generateAndEmail').addEventListener('click', () => generatePDF(true));

    // Modal close
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('emailModal').classList.add('hidden');
    });

    // Gender radio - save to profile
    document.querySelectorAll('input[name="gender"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const profile = JSON.parse(localStorage.getItem('mrpProfile') || '{}');
            profile.gender = radio.value;
            localStorage.setItem('mrpProfile', JSON.stringify(profile));
        });
    });
}

// Handle "Same as Participant" checkbox
function handleSameAsParticipant(e) {
    const patientFields = document.getElementById('patientFields');
    const inputs = patientFields.querySelectorAll('input, select');

    if (e.target.checked) {
        // Copy participant data to patient
        document.getElementById('patientLastName').value = document.getElementById('participantLastName').value;
        document.getElementById('patientFirstName').value = document.getElementById('participantFirstName').value;
        document.getElementById('patientMI').value = document.getElementById('participantMI').value;
        document.getElementById('patientDobMonth').value = document.getElementById('dobMonth').value;
        document.getElementById('patientDobDay').value = document.getElementById('dobDay').value;
        document.getElementById('patientDobYear').value = document.getElementById('dobYear').value;
        document.getElementById('relationship').value = 'Self';

        // Disable fields
        inputs.forEach(input => input.disabled = true);
    } else {
        // Enable fields
        inputs.forEach(input => input.disabled = false);
    }
}

// Set default signature date to today
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('signatureDate').value = today;
}

// Profile Management
function saveProfile() {
    const profile = {};

    profileFields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            profile[fieldId] = element.value;
        }
    });

    // Save gender
    const genderRadio = document.querySelector('input[name="gender"]:checked');
    if (genderRadio) {
        profile.gender = genderRadio.value;
    }

    localStorage.setItem('mrpProfile', JSON.stringify(profile));
    showStatus('Profile saved successfully!', 'success');
}

function loadProfile(showMessage = false) {
    const profile = JSON.parse(localStorage.getItem('mrpProfile') || '{}');

    if (Object.keys(profile).length === 0) {
        if (showMessage) {
            showStatus('No saved profile found', 'info');
        }
        return;
    }

    profileFields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element && profile[fieldId]) {
            element.value = profile[fieldId];
        }
    });

    // Load gender
    if (profile.gender) {
        const radio = document.querySelector(`input[name="gender"][value="${profile.gender}"]`);
        if (radio) {
            radio.checked = true;
        }
    }

    if (showMessage) {
        showStatus('Profile loaded successfully!', 'success');
    }
}

function loadProfileIfExists() {
    loadProfile(false);
}

function exportProfile() {
    const profile = {};

    profileFields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            profile[fieldId] = element.value;
        }
    });

    const genderRadio = document.querySelector('input[name="gender"]:checked');
    if (genderRadio) {
        profile.gender = genderRadio.value;
    }

    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mrp-profile-${profile.participantLastName || 'export'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showStatus('Profile exported!', 'success');
}

function importProfile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const profile = JSON.parse(event.target.result);

            profileFields.forEach(fieldId => {
                const element = document.getElementById(fieldId);
                if (element && profile[fieldId] !== undefined) {
                    element.value = profile[fieldId];
                }
            });

            if (profile.gender) {
                const radio = document.querySelector(`input[name="gender"][value="${profile.gender}"]`);
                if (radio) {
                    radio.checked = true;
                }
            }

            // Save to localStorage as well
            localStorage.setItem('mrpProfile', JSON.stringify(profile));
            showStatus('Profile imported successfully!', 'success');
        } catch (error) {
            showStatus('Error importing profile. Invalid file format.', 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
}

// File Upload Handling
function handleFileSelect(e) {
    handleFiles(e.target.files);
}

const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB limit for Gmail

function getTotalUploadSize() {
    return uploadedFiles.filter(f => f !== null).reduce((sum, f) => sum + f.size, 0);
}

function updateUploadSizeDisplay() {
    const totalBytes = getTotalUploadSize();
    const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
    const el = document.getElementById('uploadSizeInfo');
    el.textContent = `${totalMB} MB / 25 MB`;
    el.classList.toggle('warning', totalBytes > MAX_TOTAL_SIZE * 0.8);
    el.classList.toggle('error', totalBytes >= MAX_TOTAL_SIZE);
}

function handleFiles(files) {
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
            showStatus(`Unsupported file type: ${file.name}`, 'error');
            return;
        }

        const newTotal = getTotalUploadSize() + file.size;
        if (newTotal > MAX_TOTAL_SIZE) {
            const currentMB = (getTotalUploadSize() / (1024 * 1024)).toFixed(1);
            const fileMB = (file.size / (1024 * 1024)).toFixed(1);
            showStatus(`Cannot add ${file.name} (${fileMB}MB). Would exceed 25MB limit. Current: ${currentMB}MB`, 'error');
            return;
        }

        uploadedFiles.push(file);
        displayFile(file);
    });
    updateUploadSizeDisplay();
}

function displayFile(file) {
    const fileList = document.getElementById('fileList');
    const fileIndex = uploadedFiles.length - 1;

    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.dataset.index = fileIndex;

    const extension = file.name.split('.').pop().toUpperCase();
    const size = formatFileSize(file.size);

    fileItem.innerHTML = `
        <div class="file-info">
            <div class="file-icon">${extension}</div>
            <div>
                <div class="file-name">${file.name}</div>
                <div class="file-size">${size}</div>
            </div>
        </div>
        <button type="button" class="btn btn-small btn-danger remove-file">Remove</button>
    `;

    fileItem.querySelector('.remove-file').addEventListener('click', () => {
        uploadedFiles[fileIndex] = null;
        fileItem.remove();
        updateUploadSizeDisplay();
    });

    fileList.appendChild(fileItem);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// PDF Generation
async function generatePDF(openEmail = false) {
    // Validate form
    if (!validateForm()) {
        return;
    }

    const generateBtn = document.getElementById(openEmail ? 'generateAndEmail' : 'generatePDF');
    generateBtn.classList.add('loading');
    generateBtn.disabled = true;

    try {
        // Load the blank PDF form
        const formUrl = 'New-Claim-Form-Final.pdf';
        const existingPdfBytes = await fetch(formUrl).then(res => {
            if (!res.ok) throw new Error('Could not load PDF form');
            return res.arrayBuffer();
        });

        // Load the PDF
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        // Get the first page (we'll only fill pages 1-2 of the form)
        const pages = pdfDoc.getPages();
        const page1 = pages[0];
        const page2 = pages[1];

        // Remove the instructions page (page 3)
        if (pages.length > 2) {
            pdfDoc.removePage(2);
        }

        // Embed font
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const textColor = rgb(0, 0, 0);

        // Get form data
        const formData = getFormData();

        // Helper function to draw text at a field location
        function drawFieldText(page, fieldKey, text, fontSizeOverride = null) {
            const field = FORM_FIELDS[fieldKey];
            if (!field || !text) return;
            const size = fontSizeOverride || field.fontSize || 10;
            page.drawText(text, { x: toPdfX(field.x), y: toPdfY(field.y), size, font, color: textColor });
        }

        // Helper function to draw checkbox mark
        function drawCheckbox(page, fieldKey) {
            const field = FORM_FIELDS[fieldKey];
            if (!field) return;
            page.drawText('X', { x: toPdfX(field.x), y: toPdfY(field.y), size: 12, font, color: textColor });
        }

        // ===== PAGE 1 - Participant Information =====
        drawFieldText(page1, 'participant_last_name', formData.participantLastName);
        drawFieldText(page1, 'participant_first_name', formData.participantFirstName);
        drawFieldText(page1, 'participant_mi', formData.participantMI);

        // SSN/Participant ID
        drawFieldText(page1, 'ssn', formData.participantID);

        // Gender checkboxes
        if (formData.gender === 'male') {
            drawCheckbox(page1, 'gender_male');
        } else if (formData.gender === 'female') {
            drawCheckbox(page1, 'gender_female');
        }

        // Date of Birth
        drawFieldText(page1, 'dob_month', formData.dobMonth);
        drawFieldText(page1, 'dob_day', formData.dobDay);
        drawFieldText(page1, 'dob_year', formData.dobYear);

        // Address
        drawFieldText(page1, 'street', formData.street);
        drawFieldText(page1, 'city', formData.city);
        drawFieldText(page1, 'state', formData.state);
        drawFieldText(page1, 'zip', formData.zip);

        // Contact
        drawFieldText(page1, 'phone', formData.telephone);
        drawFieldText(page1, 'email', formData.email);
        drawFieldText(page1, 'other_coverage', formData.otherCoverage);

        // Patient Information
        drawFieldText(page1, 'patient_last_name', formData.patientLastName);
        drawFieldText(page1, 'patient_first_name', formData.patientFirstName);
        drawFieldText(page1, 'patient_mi', formData.patientMI);
        drawFieldText(page1, 'patient_relationship', formData.relationship);

        // Patient DOB
        drawFieldText(page1, 'patient_dob_month', formData.patientDobMonth);
        drawFieldText(page1, 'patient_dob_day', formData.patientDobDay);
        drawFieldText(page1, 'patient_dob_year', formData.patientDobYear);

        // ===== PAGE 2 - Expense Table =====
        formData.expenses.forEach((expense, index) => {
            if (index < 8) {
                const rowKey = `expense_${index + 1}`;
                const row = FORM_FIELDS[rowKey];
                if (row) {
                    const fontSize = row.fontSize || 9;
                    const y = toPdfY(row.y);

                    // Provider
                    page2.drawText(expense.provider, { x: toPdfX(row.provider_x), y, size: fontSize, font, color: textColor });

                    // Service Date
                    page2.drawText(expense.dates, { x: toPdfX(row.date_x), y, size: fontSize, font, color: textColor });

                    // Charges
                    page2.drawText(`$${expense.amount.toFixed(2)}`, { x: toPdfX(row.amount_x), y, size: fontSize, font, color: textColor });
                }
            }
        });

        // Total Amount
        drawFieldText(page2, 'total_amount', formData.totalAmount);

        // Dental checkboxes
        if (formData.dentalPlan === 'yes') {
            drawCheckbox(page2, 'dental_yes');
        } else {
            drawCheckbox(page2, 'dental_no');
        }

        // Vision checkboxes
        if (formData.visionPlan === 'yes') {
            drawCheckbox(page2, 'vision_yes');
        } else {
            drawCheckbox(page2, 'vision_no');
        }

        // Signature
        if (!signaturePad.isEmpty()) {
            const signatureDataUrl = signaturePad.toDataURL('image/png');
            const signatureImageBytes = await fetch(signatureDataUrl).then(res => res.arrayBuffer());
            const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

            const sigField = FORM_FIELDS.signature_image;

            // Constrain signature to fit within a standard signature line
            const maxWidth = 180;
            const maxHeight = 40;

            let width = signatureImage.width;
            let height = signatureImage.height;

            // Scale down to fit within bounds while maintaining aspect ratio
            const scale = Math.min(maxWidth / width, maxHeight / height, 1);
            width *= scale;
            height *= scale;

            page2.drawImage(signatureImage, {
                x: toPdfX(sigField.x),
                y: toPdfY(sigField.y) - height + 10,
                width: width,
                height: height
            });
        }

        // Signature Date
        drawFieldText(page2, 'signature_date', formData.signatureDate);

        // Append uploaded receipts
        const validFiles = uploadedFiles.filter(f => f !== null);
        for (const file of validFiles) {
            if (file.type === 'application/pdf') {
                // Embed PDF pages
                const receiptPdfBytes = await file.arrayBuffer();
                const receiptPdf = await PDFDocument.load(receiptPdfBytes);
                const copiedPages = await pdfDoc.copyPages(receiptPdf, receiptPdf.getPageIndices());
                copiedPages.forEach(page => pdfDoc.addPage(page));
            } else if (file.type.startsWith('image/')) {
                // Convert image to grayscale to reduce file size
                const grayscaleBytes = await convertToGrayscale(file);
                const image = await pdfDoc.embedJpg(grayscaleBytes);

                // Create a new page sized to fit the image (max letter size)
                const maxWidth = 612;
                const maxHeight = 792;

                let width = image.width;
                let height = image.height;

                // Scale to fit
                if (width > maxWidth || height > maxHeight) {
                    const scale = Math.min(maxWidth / width, maxHeight / height);
                    width *= scale;
                    height *= scale;
                }

                const page = pdfDoc.addPage([maxWidth, maxHeight]);

                // Center the image
                const x = (maxWidth - width) / 2;
                const y = (maxHeight - height) / 2;

                page.drawImage(image, { x, y, width, height });
            }
        }

        // Save the PDF
        const pdfBytes = await pdfDoc.save();

        // Download
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const lastName = formData.participantLastName || 'Claim';
        const today = new Date().toISOString().split('T')[0];
        const filename = `MRP-Claim-${lastName}-${today}.pdf`;
        a.download = filename;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showStatus('PDF generated successfully!', 'success');

        // Open email if requested
        if (openEmail) {
            const subject = encodeURIComponent(`MRP Claim - ${lastName} - ${today}`);
            const body = encodeURIComponent('Please find my MRP claim form attached.\n\nThank you.');
            window.location.href = `mailto:claims@iatsenbf.org?subject=${subject}&body=${body}`;

            // Show modal with instructions
            document.getElementById('emailModal').classList.remove('hidden');
        }

    } catch (error) {
        console.error('PDF generation error:', error);
        showStatus(`Error generating PDF: ${error.message}`, 'error');
    } finally {
        generateBtn.classList.remove('loading');
        generateBtn.disabled = false;
    }
}

// Get all form data
function getFormData() {
    const getVal = (id) => document.getElementById(id)?.value || '';
    const getRadio = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value || '';

    // Get expense rows
    const expenses = [];
    const rows = document.querySelectorAll('.expense-row');
    rows.forEach((row, index) => {
        const provider = row.querySelector(`input[name="provider_${index}"]`)?.value || '';
        const dates = row.querySelector(`input[name="dates_${index}"]`)?.value || '';
        const amount = row.querySelector(`input[name="amount_${index}"]`)?.value || '';

        if (provider || dates || amount) {
            expenses.push({ provider, dates, amount: parseFloat(amount) || 0 });
        }
    });

    // Calculate total
    const total = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    return {
        participantLastName: getVal('participantLastName'),
        participantFirstName: getVal('participantFirstName'),
        participantMI: getVal('participantMI'),
        participantID: getVal('participantID'),
        gender: getRadio('gender'),
        dobMonth: getVal('dobMonth'),
        dobDay: getVal('dobDay'),
        dobYear: getVal('dobYear'),
        street: getVal('street'),
        city: getVal('city'),
        state: getVal('state'),
        zip: getVal('zip'),
        telephone: getVal('telephone'),
        email: getVal('email'),
        otherCoverage: getVal('otherCoverage'),
        patientLastName: getVal('patientLastName'),
        patientFirstName: getVal('patientFirstName'),
        patientMI: getVal('patientMI'),
        relationship: getVal('relationship'),
        patientDobMonth: getVal('patientDobMonth'),
        patientDobDay: getVal('patientDobDay'),
        patientDobYear: getVal('patientDobYear'),
        expenses: expenses,
        totalAmount: `$${total.toFixed(2)}`,
        dentalPlan: getRadio('dentalPlan'),
        visionPlan: getRadio('visionPlan'),
        signatureDate: formatDate(getVal('signatureDate'))
    };
}

// Convert image to grayscale JPEG for smaller file size
async function convertToGrayscale(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            // Draw original image
            ctx.drawImage(img, 0, 0);

            // Get image data and convert to grayscale
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                data[i] = gray;     // R
                data[i + 1] = gray; // G
                data[i + 2] = gray; // B
                // Alpha (data[i + 3]) stays the same
            }

            ctx.putImageData(imageData, 0, 0);

            // Export as JPEG with 80% quality for good compression
            canvas.toBlob(blob => {
                blob.arrayBuffer().then(resolve).catch(reject);
            }, 'image/jpeg', 0.8);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

// Format date from YYYY-MM-DD to MM/DD/YYYY
function formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${month}/${day}/${year}`;
}

// Validate form
function validateForm() {
    // Check required fields
    const requiredFields = [
        'participantLastName', 'participantFirstName', 'participantID',
        'dobMonth', 'dobDay', 'dobYear',
        'street', 'city', 'state', 'zip',
        'telephone', 'email',
        'patientLastName', 'patientFirstName',
        'patientDobMonth', 'patientDobDay', 'patientDobYear',
        'relationship', 'signatureDate'
    ];

    for (const fieldId of requiredFields) {
        const field = document.getElementById(fieldId);
        if (!field || !field.value.trim()) {
            if (!field.disabled) {
                showStatus(`Please fill in all required fields`, 'error');
                field?.focus();
                return false;
            }
        }
    }

    // Check gender
    if (!document.querySelector('input[name="gender"]:checked')) {
        showStatus('Please select a gender', 'error');
        return false;
    }

    // Check signature
    if (signaturePad.isEmpty()) {
        showStatus('Please provide your signature', 'error');
        return false;
    }

    // Check at least one expense row has data
    const amounts = document.querySelectorAll('.amount-input');
    let hasExpense = false;
    amounts.forEach(input => {
        if (parseFloat(input.value) > 0) {
            hasExpense = true;
        }
    });

    if (!hasExpense) {
        showStatus('Please add at least one expense item', 'error');
        return false;
    }

    return true;
}

// Show status message
function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.classList.remove('hidden');

    setTimeout(() => {
        statusEl.classList.add('hidden');
    }, 4000);
}
