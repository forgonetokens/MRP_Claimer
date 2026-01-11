#!/usr/bin/env node
// Test PDF Generator with final calibrated coordinates

const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');

// Calibrated conversion formula
const CROP_HEIGHT = 792;
const CROP_OFFSET_X = 38;
const CROP_OFFSET_Y = 28;

function toPdfX(rawX) { return rawX + CROP_OFFSET_X; }
function toPdfY(rawY) { return (CROP_HEIGHT - rawY) + CROP_OFFSET_Y; }

// Form field definitions (raw visual coordinates)
const FORM_FIELDS = {
    // Page 1 - Participant Information
    participant_last_name: { x: 164, y: 405, fontSize: 11 },
    participant_first_name: { x: 321, y: 405, fontSize: 11 },
    participant_mi: { x: 497, y: 405, fontSize: 11 },
    ssn: { x: 177, y: 432, fontSize: 11 },
    gender_male: { x: 424, y: 433 },
    gender_female: { x: 502.5, y: 433 },

    // Page 1 - Date of Birth
    dob_month: { x: 164, y: 460, fontSize: 11 },
    dob_day: { x: 257, y: 460, fontSize: 11 },
    dob_year: { x: 347, y: 460, fontSize: 11 },

    // Page 1 - Address
    street: { x: 104, y: 488, fontSize: 10 },
    city: { x: 316, y: 488, fontSize: 10 },
    state: { x: 451, y: 488, fontSize: 10 },
    zip: { x: 486, y: 488, fontSize: 10 },

    // Page 1 - Contact
    phone: { x: 129, y: 516, fontSize: 10 },
    email: { x: 327, y: 516, fontSize: 9 },
    other_coverage: { x: 257, y: 544, fontSize: 10 },

    // Page 1 - Patient Information
    patient_last_name: { x: 129, y: 571, fontSize: 11 },
    patient_first_name: { x: 303, y: 571, fontSize: 11 },
    patient_mi: { x: 503.5, y: 571, fontSize: 11 },
    patient_relationship: { x: 192, y: 605, fontSize: 11 },

    // Page 1 - Patient DOB
    patient_dob_month: { x: 164, y: 629, fontSize: 11 },
    patient_dob_day: { x: 263, y: 629, fontSize: 11 },
    patient_dob_year: { x: 343, y: 629, fontSize: 11 },

    // Page 2 - Expense Table (8 rows)
    expense_1: { provider_x: 46, date_x: 280, amount_x: 447, y: 124, fontSize: 9 },
    expense_2: { provider_x: 46, date_x: 280, amount_x: 447, y: 142, fontSize: 9 },
    expense_3: { provider_x: 46, date_x: 280, amount_x: 447, y: 160, fontSize: 9 },
    expense_4: { provider_x: 46, date_x: 280, amount_x: 447, y: 178, fontSize: 9 },
    expense_5: { provider_x: 46, date_x: 280, amount_x: 447, y: 196, fontSize: 9 },
    expense_6: { provider_x: 46, date_x: 280, amount_x: 447, y: 214, fontSize: 9 },
    expense_7: { provider_x: 46, date_x: 280, amount_x: 447, y: 232, fontSize: 9 },
    expense_8: { provider_x: 46, date_x: 280, amount_x: 447, y: 250, fontSize: 9 },

    // Page 2 - Totals and Checkboxes
    total_amount: { x: 447, y: 290, fontSize: 11 },
    dental_yes: { x: 275, y: 325 },
    dental_no: { x: 316, y: 324 },
    vision_yes: { x: 449, y: 323 },
    vision_no: { x: 497, y: 324 },

    // Page 2 - Signature
    signature_date: { x: 449, y: 640, fontSize: 10 },
    signature_image: { x: 100, y: 640, width: 200, height: 50 }
};

// Sample test data
const testData = {
    participantLastName: 'Johnson',
    participantFirstName: 'Michael',
    participantMI: 'R',
    participantID: '123-45-6789',
    gender: 'male',
    dobMonth: '03',
    dobDay: '15',
    dobYear: '1985',
    street: '742 Evergreen Terrace',
    city: 'Springfield',
    state: 'IL',
    zip: '62701',
    telephone: '555-123-4567',
    email: 'mjohnson@email.com',
    otherCoverage: '',
    patientLastName: 'Johnson',
    patientFirstName: 'Michael',
    patientMI: 'R',
    relationship: 'Self',
    patientDobMonth: '03',
    patientDobDay: '15',
    patientDobYear: '1985',
    expenses: [
        { provider: 'City Medical Center', dates: '12/15/2025', amount: 150.00 },
        { provider: 'Downtown Pharmacy', dates: '12/16/2025', amount: 45.50 },
        { provider: 'Vision Plus Optometry', dates: '12/20/2025', amount: 225.00 },
        { provider: 'Dental Care Associates', dates: '12/22/2025', amount: 180.00 },
    ],
    totalAmount: '$600.50',
    dentalPlan: 'no',
    visionPlan: 'yes',
    signatureDate: '01/09/2026'
};

async function generateTestPDF() {
    const pdfDoc = await PDFDocument.load(fs.readFileSync('New-Claim-Form-Final.pdf'));
    const pages = pdfDoc.getPages();
    const page1 = pages[0];
    const page2 = pages[1];

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const color = rgb(0, 0, 0);

    function drawText(page, fieldKey, text, fontSizeOverride = null) {
        const field = FORM_FIELDS[fieldKey];
        if (!field || !text) return;
        const size = fontSizeOverride || field.fontSize || 10;
        page.drawText(text, { x: toPdfX(field.x), y: toPdfY(field.y), size, font, color });
    }

    function drawCheckbox(page, fieldKey) {
        const field = FORM_FIELDS[fieldKey];
        if (!field) return;
        page.drawText('X', { x: toPdfX(field.x), y: toPdfY(field.y), size: 12, font, color });
    }

    // ===== PAGE 1 =====
    drawText(page1, 'participant_last_name', testData.participantLastName);
    drawText(page1, 'participant_first_name', testData.participantFirstName);
    drawText(page1, 'participant_mi', testData.participantMI);
    drawText(page1, 'ssn', testData.participantID);

    if (testData.gender === 'male') drawCheckbox(page1, 'gender_male');
    else drawCheckbox(page1, 'gender_female');

    drawText(page1, 'dob_month', testData.dobMonth);
    drawText(page1, 'dob_day', testData.dobDay);
    drawText(page1, 'dob_year', testData.dobYear);

    drawText(page1, 'street', testData.street);
    drawText(page1, 'city', testData.city);
    drawText(page1, 'state', testData.state);
    drawText(page1, 'zip', testData.zip);

    drawText(page1, 'phone', testData.telephone);
    drawText(page1, 'email', testData.email);
    drawText(page1, 'other_coverage', testData.otherCoverage);

    drawText(page1, 'patient_last_name', testData.patientLastName);
    drawText(page1, 'patient_first_name', testData.patientFirstName);
    drawText(page1, 'patient_mi', testData.patientMI);
    drawText(page1, 'patient_relationship', testData.relationship);

    drawText(page1, 'patient_dob_month', testData.patientDobMonth);
    drawText(page1, 'patient_dob_day', testData.patientDobDay);
    drawText(page1, 'patient_dob_year', testData.patientDobYear);

    // ===== PAGE 2 - Expenses =====
    testData.expenses.forEach((expense, index) => {
        if (index < 8) {
            const rowKey = `expense_${index + 1}`;
            const row = FORM_FIELDS[rowKey];
            if (row) {
                const fontSize = row.fontSize || 9;
                const y = toPdfY(row.y);
                page2.drawText(expense.provider, { x: toPdfX(row.provider_x), y, size: fontSize, font, color });
                page2.drawText(expense.dates, { x: toPdfX(row.date_x), y, size: fontSize, font, color });
                page2.drawText(`$${expense.amount.toFixed(2)}`, { x: toPdfX(row.amount_x), y, size: fontSize, font, color });
            }
        }
    });

    drawText(page2, 'total_amount', testData.totalAmount);

    if (testData.dentalPlan === 'yes') drawCheckbox(page2, 'dental_yes');
    else drawCheckbox(page2, 'dental_no');

    if (testData.visionPlan === 'yes') drawCheckbox(page2, 'vision_yes');
    else drawCheckbox(page2, 'vision_no');

    drawText(page2, 'signature_date', testData.signatureDate);

    // Draw a placeholder signature (just text for testing)
    const sigField = FORM_FIELDS.signature_image;
    page2.drawText('[SIGNATURE]', {
        x: toPdfX(sigField.x),
        y: toPdfY(sigField.y),
        size: 12,
        font,
        color
    });

    // Save
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync('test-output.pdf', pdfBytes);
    console.log('Generated: test-output.pdf');
}

generateTestPDF().catch(console.error);
