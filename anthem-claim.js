// Anthem Insurance Claim Form Generator
// Main Application JavaScript

const { PDFDocument, rgb, StandardFonts } = PDFLib;

// Form Field Coordinates from mapping tool
// Origins: text/date = lower-left baseline, checkbox = center, signature = lower-left corner
const FORM_FIELDS = {
    // Section 1: Member Information
    member_last_name: { type: 'text', x: 93, y: 675, maxWidth: 189 },
    member_first_name: { type: 'text', x: 350, y: 675, maxWidth: 156 },
    member_mi: { type: 'text', x: 538, y: 675, maxWidth: 34 },
    member_id: { type: 'text', x: 93, y: 647, maxWidth: 190 },
    group_no: { type: 'text', x: 348, y: 648, maxWidth: 160 },
    member_street: { type: 'text', x: 93, y: 620, maxWidth: 212 },
    member_city: { type: 'text', x: 332, y: 620, maxWidth: 117 },
    member_state: { type: 'text', x: 472, y: 620, maxWidth: 34 },
    member_zip: { type: 'text', x: 516, y: 620, maxWidth: 53 },

    // Section 2: Patient Information
    patient_last_name: { type: 'text', x: 84, y: 574, maxWidth: 220 },
    patient_first_name: { type: 'text', x: 342, y: 575, maxWidth: 168 },
    patient_mi: { type: 'text', x: 539, y: 573, maxWidth: 31 },
    patient_sex_male: { type: 'checkbox', x: 44, y: 552, size: 14 },
    patient_sex_female: { type: 'checkbox', x: 88, y: 552, size: 14 },
    patient_dob: { type: 'date', x: 199, y: 547, totalWidth: 105, digits: 8 },
    relationship_self: { type: 'checkbox', x: 314, y: 552, size: 14 },
    relationship_spouse: { type: 'checkbox', x: 356, y: 553, size: 14 },
    relationship_son: { type: 'checkbox', x: 410, y: 552, size: 14 },
    relationship_daughter: { type: 'checkbox', x: 450, y: 552, size: 14 },

    // Section 3: Diagnosis
    illness: { type: 'text', x: 74, y: 501, maxWidth: 278 },
    accident_date: { type: 'date', x: 467, y: 501, totalWidth: 110, digits: 8 },

    // Section 4: Work-related
    work_related_yes: { type: 'checkbox', x: 190, y: 470, size: 14 },
    work_related_no: { type: 'checkbox', x: 221, y: 469, size: 14 },
    employer_name: { type: 'text', x: 87, y: 437, maxWidth: 343 },
    employer_street: { type: 'text', x: 88, y: 410, maxWidth: 204 },
    employer_city: { type: 'text', x: 331, y: 411, maxWidth: 131 },
    employer_state: { type: 'text', x: 469, y: 410, maxWidth: 30 },
    employer_zip: { type: 'text', x: 508, y: 410, maxWidth: 54 },

    // Section 5: Other Group Health Insurance
    other_insurance_yes: { type: 'checkbox', x: 232, y: 379, size: 14 },
    other_insurance_no: { type: 'checkbox', x: 263, y: 378, size: 14 },
    policyholder_name: { type: 'text', x: 49, y: 347, maxWidth: 125 },
    policyholder_dob: { type: 'date', x: 185, y: 347, totalWidth: 107, digits: 8 },
    other_insurance_company: { type: 'text', x: 300, y: 347, maxWidth: 100 },
    other_policy_id: { type: 'text', x: 417, y: 346, maxWidth: 74 },
    other_group_no: { type: 'text', x: 501, y: 346, maxWidth: 70 },

    // Section 6: Medicare
    medicare_yes: { type: 'checkbox', x: 174, y: 313, size: 14 },
    medicare_no: { type: 'checkbox', x: 204, y: 314, size: 14 },
    part_a_checkbox: { type: 'checkbox', x: 45, y: 294, size: 14 },
    part_b_checkbox: { type: 'checkbox', x: 312, y: 293, size: 14 },
    part_d_checkbox: { type: 'checkbox', x: 45, y: 280, size: 14 },
    part_a_date: { type: 'date', x: 137, y: 293, totalWidth: 107, digits: 8 },
    part_b_date: { type: 'date', x: 408, y: 292, totalWidth: 109, digits: 8 },
    part_d_date: { type: 'date', x: 136, y: 279, totalWidth: 108, digits: 8 },
    part_d_carrier: { type: 'text', x: 357, y: 279, maxWidth: 206 },

    // Section 7: Signatures
    patient_signature: { type: 'signature', x: 120, y: 70, maxWidth: 200, maxHeight: 20 },
    patient_signature_date: { type: 'date', x: 469, y: 75, totalWidth: 109, digits: 8 },
    member_signature: { type: 'signature', x: 120, y: 44, maxWidth: 200, maxHeight: 20 },
    member_signature_date: { type: 'date', x: 468, y: 46, totalWidth: 109, digits: 8 }
};

// DOM Elements
let patientSignaturePad;
let memberSignaturePad;
let uploadedFiles = [];

// Profile fields for localStorage
const profileFields = [
    'memberLastName', 'memberFirstName', 'memberMI',
    'memberID', 'groupNo',
    'memberStreet', 'memberCity', 'memberState', 'memberZip'
];

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initSignaturePads();
    initEventListeners();
    loadProfileIfExists();
    setDefaultDates();
});

// Initialize Signature Pads
function initSignaturePads() {
    const patientCanvas = document.getElementById('patientSignaturePad');
    const memberCanvas = document.getElementById('memberSignaturePad');

    patientSignaturePad = new SignaturePad(patientCanvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)'
    });

    memberSignaturePad = new SignaturePad(memberCanvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)'
    });

    function resizeCanvas(canvas, pad) {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * ratio;
        canvas.height = rect.height * ratio;
        canvas.getContext('2d').scale(ratio, ratio);
        pad.clear();
    }

    function resizeAll() {
        resizeCanvas(patientCanvas, patientSignaturePad);
        resizeCanvas(memberCanvas, memberSignaturePad);
    }

    window.addEventListener('resize', resizeAll);
    resizeAll();

    document.getElementById('clearPatientSignature').addEventListener('click', () => {
        patientSignaturePad.clear();
    });

    document.getElementById('clearMemberSignature').addEventListener('click', () => {
        memberSignaturePad.clear();
    });
}

// Initialize event listeners
function initEventListeners() {
    // Same as member checkbox
    document.getElementById('sameAsMember').addEventListener('change', handleSameAsMember);

    // Work-related toggle
    document.querySelectorAll('input[name="workRelated"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.getElementById('workRelatedFields').classList.toggle('hidden', e.target.value !== 'yes');
        });
    });

    // Other insurance toggle
    document.querySelectorAll('input[name="otherInsurance"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.getElementById('otherInsuranceFields').classList.toggle('hidden', e.target.value !== 'yes');
        });
    });

    // Medicare toggle
    document.querySelectorAll('input[name="medicare"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.getElementById('medicareFields').classList.toggle('hidden', e.target.value !== 'yes');
        });
    });

    // Profile management
    document.getElementById('saveProfile').addEventListener('click', saveProfile);
    document.getElementById('loadProfile').addEventListener('click', () => loadProfile(true));

    // File upload
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('receiptUpload');

    fileInput.addEventListener('change', handleFileSelect);

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

    // Generate button
    document.getElementById('generatePDF').addEventListener('click', generatePDF);
}

// Handle "Same as Member" checkbox
function handleSameAsMember(e) {
    // Only disable name fields and relationship - DOB and sex must still be editable
    const fieldsToDisable = ['patientLastName', 'patientFirstName', 'patientMI', 'relationship'];

    if (e.target.checked) {
        document.getElementById('patientLastName').value = document.getElementById('memberLastName').value;
        document.getElementById('patientFirstName').value = document.getElementById('memberFirstName').value;
        document.getElementById('patientMI').value = document.getElementById('memberMI').value;
        document.getElementById('relationship').value = 'Self';
        fieldsToDisable.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.disabled = true;
        });
    } else {
        fieldsToDisable.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.disabled = false;
        });
    }
}

// Set default dates to today
function setDefaultDates() {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const yyyy = String(today.getFullYear());

    // Patient signature date
    document.getElementById('patientSigDateMonth').value = mm;
    document.getElementById('patientSigDateDay').value = dd;
    document.getElementById('patientSigDateYear').value = yyyy;

    // Member signature date
    document.getElementById('memberSigDateMonth').value = mm;
    document.getElementById('memberSigDateDay').value = dd;
    document.getElementById('memberSigDateYear').value = yyyy;
}

// Helper to combine date fields into MMDDYYYY format
function getDateValue(prefix) {
    const month = document.getElementById(`${prefix}Month`)?.value || '';
    const day = document.getElementById(`${prefix}Day`)?.value || '';
    const year = document.getElementById(`${prefix}Year`)?.value || '';
    if (!month && !day && !year) return '';
    return month.padStart(2, '0') + day.padStart(2, '0') + year;
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
    localStorage.setItem('anthemProfile', JSON.stringify(profile));
    showStatus('Profile saved successfully!', 'success');
}

function loadProfile(showMessage = false) {
    const profile = JSON.parse(localStorage.getItem('anthemProfile') || '{}');

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

    if (showMessage) {
        showStatus('Profile loaded successfully!', 'success');
    }
}

function loadProfileIfExists() {
    loadProfile(false);
}

// File Upload Handling
const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB limit

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

function handleFileSelect(e) {
    handleFiles(e.target.files);
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

// Convert image to grayscale JPEG for smaller file size
async function convertToGrayscale(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                data[i] = gray;
                data[i + 1] = gray;
                data[i + 2] = gray;
            }

            ctx.putImageData(imageData, 0, 0);

            canvas.toBlob(blob => {
                blob.arrayBuffer().then(resolve).catch(reject);
            }, 'image/jpeg', 0.8);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

// PDF Generation
async function generatePDF() {
    if (!validateForm()) {
        return;
    }

    const generateBtn = document.getElementById('generatePDF');
    generateBtn.classList.add('loading');
    generateBtn.disabled = true;

    try {
        // Load the blank PDF form
        const formUrl = 'Anthem_Claim_Form.pdf';
        const existingPdfBytes = await fetch(formUrl).then(res => {
            if (!res.ok) throw new Error('Could not load PDF form');
            return res.arrayBuffer();
        });

        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const pages = pdfDoc.getPages();
        const page1 = pages[0];

        // Remove the instructions page (page 2)
        if (pages.length > 1) {
            pdfDoc.removePage(1);
        }

        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const textColor = rgb(0, 0, 0);

        const formData = getFormData();

        // Helper function to draw text at baseline
        function drawText(page, fieldKey, text) {
            const field = FORM_FIELDS[fieldKey];
            if (!field || !text) return;
            page.drawText(String(text), {
                x: field.x,
                y: field.y,
                size: 10,
                font,
                color: textColor
            });
        }

        // Helper function to draw date with spaced digits
        function drawDate(page, fieldKey, dateStr) {
            const field = FORM_FIELDS[fieldKey];
            if (!field || !dateStr) return;
            const digits = String(dateStr).replace(/\D/g, '');
            if (digits.length === 0) return;

            const numDigits = field.digits || 8;
            const spacing = field.totalWidth / numDigits;

            for (let i = 0; i < digits.length && i < numDigits; i++) {
                page.drawText(digits[i], {
                    x: field.x + (i * spacing) + (spacing / 2) - 3,
                    y: field.y,
                    size: 10,
                    font,
                    color: textColor
                });
            }
        }

        // Helper function to draw checkbox (centered at x, y)
        function drawCheckbox(page, fieldKey) {
            const field = FORM_FIELDS[fieldKey];
            if (!field) return;
            const checkSize = 10;
            page.drawText('X', {
                x: field.x - (checkSize / 2),
                y: field.y - (checkSize / 2),
                size: checkSize,
                font,
                color: textColor
            });
        }
        // Section 1: Member Information
        drawText(page1, 'member_last_name', formData.memberLastName);
        drawText(page1, 'member_first_name', formData.memberFirstName);
        drawText(page1, 'member_mi', formData.memberMI);
        drawText(page1, 'member_id', formData.memberID);
        drawText(page1, 'group_no', formData.groupNo);
        drawText(page1, 'member_street', formData.memberStreet);
        drawText(page1, 'member_city', formData.memberCity);
        drawText(page1, 'member_state', formData.memberState);
        drawText(page1, 'member_zip', formData.memberZip);

        // Section 2: Patient Information
        drawText(page1, 'patient_last_name', formData.patientLastName);
        drawText(page1, 'patient_first_name', formData.patientFirstName);
        drawText(page1, 'patient_mi', formData.patientMI);

        if (formData.patientSex === 'male') {
            drawCheckbox(page1, 'patient_sex_male');
        } else if (formData.patientSex === 'female') {
            drawCheckbox(page1, 'patient_sex_female');
        }

        drawDate(page1, 'patient_dob', formData.patientDOB);

        if (formData.relationship === 'Self') drawCheckbox(page1, 'relationship_self');
        if (formData.relationship === 'Spouse') drawCheckbox(page1, 'relationship_spouse');
        if (formData.relationship === 'Son') drawCheckbox(page1, 'relationship_son');
        if (formData.relationship === 'Daughter') drawCheckbox(page1, 'relationship_daughter');

        // Section 3: Diagnosis
        drawText(page1, 'illness', formData.illness);
        drawDate(page1, 'accident_date', formData.accidentDate);

        // Section 4: Work-related
        if (formData.workRelated === 'yes') {
            drawCheckbox(page1, 'work_related_yes');
            drawText(page1, 'employer_name', formData.employerName);
            drawText(page1, 'employer_street', formData.employerStreet);
            drawText(page1, 'employer_city', formData.employerCity);
            drawText(page1, 'employer_state', formData.employerState);
            drawText(page1, 'employer_zip', formData.employerZip);
        } else {
            drawCheckbox(page1, 'work_related_no');
        }

        // Section 5: Other Insurance
        if (formData.otherInsurance === 'yes') {
            drawCheckbox(page1, 'other_insurance_yes');
            drawText(page1, 'policyholder_name', formData.policyholderName);
            drawDate(page1, 'policyholder_dob', formData.policyholderDOB);
            drawText(page1, 'other_insurance_company', formData.otherInsuranceCompany);
            drawText(page1, 'other_policy_id', formData.otherPolicyID);
            drawText(page1, 'other_group_no', formData.otherGroupNo);
        } else {
            drawCheckbox(page1, 'other_insurance_no');
        }

        // Section 6: Medicare
        if (formData.medicare === 'yes') {
            drawCheckbox(page1, 'medicare_yes');
            drawText(page1, 'medicare_claim_no', formData.medicareClaimNo);
            if (formData.partA) {
                drawCheckbox(page1, 'part_a_checkbox');
                drawDate(page1, 'part_a_date', formData.partADate);
            }
            if (formData.partB) {
                drawCheckbox(page1, 'part_b_checkbox');
                drawDate(page1, 'part_b_date', formData.partBDate);
            }
            if (formData.partD) {
                drawCheckbox(page1, 'part_d_checkbox');
                drawDate(page1, 'part_d_date', formData.partDDate);
                drawText(page1, 'part_d_carrier', formData.partDCarrier);
            }
        } else {
            drawCheckbox(page1, 'medicare_no');
        }

        // Signatures - positioned at lower-left corner, scaled to fit maxWidth/maxHeight
        async function embedSignature(signaturePad, fieldKey) {
            if (signaturePad.isEmpty()) return;

            const field = FORM_FIELDS[fieldKey];
            if (!field) return;

            const signatureDataUrl = signaturePad.toDataURL('image/png');
            const signatureImageBytes = await fetch(signatureDataUrl).then(res => res.arrayBuffer());
            const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

            const maxWidth = field.maxWidth || 180;
            const maxHeight = field.maxHeight || 40;

            let width = signatureImage.width;
            let height = signatureImage.height;

            const scale = Math.min(maxWidth / width, maxHeight / height, 1);
            width *= scale;
            height *= scale;

            // field.x, field.y is lower-left corner of signature area
            page1.drawImage(signatureImage, {
                x: field.x,
                y: field.y,
                width: width,
                height: height
            });
        }

        await embedSignature(patientSignaturePad, 'patient_signature');
        await embedSignature(memberSignaturePad, 'member_signature');

        drawDate(page1, 'patient_signature_date', formData.patientSignatureDate);
        drawDate(page1, 'member_signature_date', formData.memberSignatureDate);

        // Append uploaded receipts
        const validFiles = uploadedFiles.filter(f => f !== null);
        for (const file of validFiles) {
            if (file.type === 'application/pdf') {
                const receiptPdfBytes = await file.arrayBuffer();
                const receiptPdf = await PDFDocument.load(receiptPdfBytes);
                const copiedPages = await pdfDoc.copyPages(receiptPdf, receiptPdf.getPageIndices());
                copiedPages.forEach(page => pdfDoc.addPage(page));
            } else if (file.type.startsWith('image/')) {
                const grayscaleBytes = await convertToGrayscale(file);
                const image = await pdfDoc.embedJpg(grayscaleBytes);

                const maxWidth = 612;
                const maxHeight = 792;

                let width = image.width;
                let height = image.height;

                if (width > maxWidth || height > maxHeight) {
                    const scale = Math.min(maxWidth / width, maxHeight / height);
                    width *= scale;
                    height *= scale;
                }

                const page = pdfDoc.addPage([maxWidth, maxHeight]);
                const x = (maxWidth - width) / 2;
                const y = (maxHeight - height) / 2;

                page.drawImage(image, { x, y, width, height });
            }
        }

        // Save and download
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const lastName = formData.memberLastName || 'Claim';
        const today = new Date().toISOString().split('T')[0];
        const filename = `Anthem-Claim-${lastName}-${today}.pdf`;
        a.download = filename;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showStatus('PDF generated successfully!', 'success');

    } catch (error) {
        console.error('PDF generation error:', error);
        showStatus(`Error generating PDF: ${error.message}`, 'error');
    } finally {
        generateBtn.classList.remove('loading');
        generateBtn.disabled = false;
    }
}

// Get form data
function getFormData() {
    const getVal = (id) => document.getElementById(id)?.value || '';
    const getRadio = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value || '';
    const getChecked = (id) => document.getElementById(id)?.checked || false;

    return {
        memberLastName: getVal('memberLastName'),
        memberFirstName: getVal('memberFirstName'),
        memberMI: getVal('memberMI'),
        memberID: getVal('memberID'),
        groupNo: getVal('groupNo'),
        memberStreet: getVal('memberStreet'),
        memberCity: getVal('memberCity'),
        memberState: getVal('memberState'),
        memberZip: getVal('memberZip'),

        patientLastName: getVal('patientLastName'),
        patientFirstName: getVal('patientFirstName'),
        patientMI: getVal('patientMI'),
        patientSex: getRadio('patientSex'),
        patientDOB: getDateValue('patientDOB'),
        relationship: getVal('relationship'),

        illness: getVal('illness'),
        accidentDate: getDateValue('accidentDate'),

        workRelated: getRadio('workRelated'),
        employerName: getVal('employerName'),
        employerStreet: getVal('employerStreet'),
        employerCity: getVal('employerCity'),
        employerState: getVal('employerState'),
        employerZip: getVal('employerZip'),

        otherInsurance: getRadio('otherInsurance'),
        policyholderName: getVal('policyholderName'),
        policyholderDOB: getDateValue('policyholderDOB'),
        otherInsuranceCompany: getVal('otherInsuranceCompany'),
        otherPolicyID: getVal('otherPolicyID'),
        otherGroupNo: getVal('otherGroupNo'),

        medicare: getRadio('medicare'),
        medicareClaimNo: getVal('medicareClaimNo'),
        partA: getChecked('partA'),
        partADate: getDateValue('partADate'),
        partB: getChecked('partB'),
        partBDate: getDateValue('partBDate'),
        partD: getChecked('partD'),
        partDDate: getDateValue('partDDate'),
        partDCarrier: getVal('partDCarrier'),

        patientSignatureDate: getDateValue('patientSigDate'),
        memberSignatureDate: getDateValue('memberSigDate')
    };
}

// Validate form
function validateForm() {
    const requiredFields = [
        'memberLastName', 'memberFirstName', 'memberID',
        'memberStreet', 'memberCity', 'memberState', 'memberZip',
        'patientLastName', 'patientFirstName',
        'patientDOBMonth', 'patientDOBDay', 'patientDOBYear',
        'relationship', 'illness',
        'patientSigDateMonth', 'patientSigDateDay', 'patientSigDateYear',
        'memberSigDateMonth', 'memberSigDateDay', 'memberSigDateYear'
    ];

    for (const fieldId of requiredFields) {
        const field = document.getElementById(fieldId);
        if (!field || !field.value.trim()) {
            if (!field?.disabled) {
                showStatus('Please fill in all required fields', 'error');
                field?.focus();
                return false;
            }
        }
    }

    // Check sex
    if (!document.querySelector('input[name="patientSex"]:checked')) {
        showStatus('Please select patient sex', 'error');
        return false;
    }

    // Check work-related
    if (!document.querySelector('input[name="workRelated"]:checked')) {
        showStatus('Please indicate if this is work-related', 'error');
        return false;
    }

    // Check signatures
    if (patientSignaturePad.isEmpty()) {
        showStatus('Please provide patient signature', 'error');
        return false;
    }

    if (memberSignaturePad.isEmpty()) {
        showStatus('Please provide member signature', 'error');
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
