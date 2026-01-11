#!/usr/bin/env node
// Test using RAW visual coordinates with calibrated conversion

const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');

// Calibrated conversion (from our testing)
const CROP_OFFSET_X = 38;
const CROP_OFFSET_Y = 28;
const CROP_HEIGHT = 792;

function toPdfX(rawX) { return rawX + CROP_OFFSET_X; }
function toPdfY(rawY) { return (CROP_HEIGHT - rawY) + CROP_OFFSET_Y; }

// Raw visual coordinates (top-left origin) from alignment tool
const RAW_FIELDS = {
    participant_last: { page: 1, x: 164, y: 405 },
    participant_first: { page: 1, x: 321, y: 405 },
    participant_mi: { page: 1, x: 497, y: 405 },
    ssn: { page: 1, x: 177, y: 432 },
    gender_male: { page: 1, x: 424, y: 433 },
    gender_female: { page: 1, x: 502.5, y: 433 },
    dob_month: { page: 1, x: 164, y: 460 },
    dob_day: { page: 1, x: 257, y: 460 },
    dob_year: { page: 1, x: 347, y: 460 },
    street: { page: 1, x: 104, y: 488 },
    city: { page: 1, x: 316, y: 488 },
    state: { page: 1, x: 451, y: 488 },
    zip: { page: 1, x: 486, y: 488 },
    phone: { page: 1, x: 129, y: 516 },
    email: { page: 1, x: 327, y: 516 },
    other_coverage: { page: 1, x: 257, y: 544 },
    patient_last: { page: 1, x: 129, y: 571 },
    patient_first: { page: 1, x: 303, y: 571 },
    patient_mi: { page: 1, x: 503.5, y: 571 },
    relationship: { page: 1, x: 192, y: 605 },
    patient_dob_month: { page: 1, x: 164, y: 629 },
    patient_dob_day: { page: 1, x: 263, y: 629 },
    patient_dob_year: { page: 1, x: 343, y: 629 },

    // Page 2
    exp1_provider: { page: 2, x: 46, y: 124 },
    exp1_date: { page: 2, x: 280, y: 124 },
    exp1_amount: { page: 2, x: 447, y: 124 },
    exp2_provider: { page: 2, x: 46, y: 142 },
    exp2_date: { page: 2, x: 280, y: 142 },
    exp2_amount: { page: 2, x: 447, y: 142 },
    exp3_provider: { page: 2, x: 46, y: 160 },
    exp3_date: { page: 2, x: 280, y: 160 },
    exp3_amount: { page: 2, x: 447, y: 160 },
    total_amount: { page: 2, x: 447, y: 290 },
    dental_yes: { page: 2, x: 275, y: 325 },
    dental_no: { page: 2, x: 316, y: 324 },
    vision_yes: { page: 2, x: 449, y: 323 },
    vision_no: { page: 2, x: 497, y: 324 },
    sig_date: { page: 2, x: 449, y: 640 },
};

const testData = {
    participant_last: 'Johnson',
    participant_first: 'Michael',
    participant_mi: 'R',
    ssn: '123-45-6789',
    gender: 'male',
    dob_month: '03',
    dob_day: '15',
    dob_year: '1985',
    street: '742 Evergreen Terrace',
    city: 'Springfield',
    state: 'IL',
    zip: '62701',
    phone: '555-123-4567',
    email: 'mjohnson@email.com',
    other_coverage: '',
    patient_last: 'Johnson',
    patient_first: 'Michael',
    patient_mi: 'R',
    relationship: 'Self',
    patient_dob_month: '03',
    patient_dob_day: '15',
    patient_dob_year: '1985',
    exp1_provider: 'City Medical Center',
    exp1_date: '12/15/2025',
    exp1_amount: '$150.00',
    exp2_provider: 'Downtown Pharmacy',
    exp2_date: '12/16/2025',
    exp2_amount: '$45.50',
    exp3_provider: 'Vision Plus',
    exp3_date: '12/20/2025',
    exp3_amount: '$225.00',
    total_amount: '$420.50',
    dental: 'no',
    vision: 'yes',
    sig_date: '01/09/2026'
};

async function generateTestPDF() {
    const pdfDoc = await PDFDocument.load(fs.readFileSync('New-Claim-Form-Final.pdf'));
    const pages = pdfDoc.getPages();
    const page1 = pages[0];
    const page2 = pages[1];

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const color = rgb(0, 0, 0);

    function drawText(page, fieldId, text, fontSize = 10) {
        const f = RAW_FIELDS[fieldId];
        if (!f || !text) return;
        page.drawText(text, { x: toPdfX(f.x), y: toPdfY(f.y), size: fontSize, font, color });
    }

    function drawCheck(page, fieldId) {
        const f = RAW_FIELDS[fieldId];
        if (!f) return;
        page.drawText('X', { x: toPdfX(f.x), y: toPdfY(f.y), size: 12, font, color });
    }

    // Page 1
    drawText(page1, 'participant_last', testData.participant_last, 11);
    drawText(page1, 'participant_first', testData.participant_first, 11);
    drawText(page1, 'participant_mi', testData.participant_mi, 11);
    drawText(page1, 'ssn', testData.ssn, 11);

    if (testData.gender === 'male') drawCheck(page1, 'gender_male');
    else drawCheck(page1, 'gender_female');

    drawText(page1, 'dob_month', testData.dob_month, 11);
    drawText(page1, 'dob_day', testData.dob_day, 11);
    drawText(page1, 'dob_year', testData.dob_year, 11);

    drawText(page1, 'street', testData.street, 10);
    drawText(page1, 'city', testData.city, 10);
    drawText(page1, 'state', testData.state, 10);
    drawText(page1, 'zip', testData.zip, 10);

    drawText(page1, 'phone', testData.phone, 10);
    drawText(page1, 'email', testData.email, 9);
    drawText(page1, 'other_coverage', testData.other_coverage, 10);

    drawText(page1, 'patient_last', testData.patient_last, 11);
    drawText(page1, 'patient_first', testData.patient_first, 11);
    drawText(page1, 'patient_mi', testData.patient_mi, 11);
    drawText(page1, 'relationship', testData.relationship, 11);

    drawText(page1, 'patient_dob_month', testData.patient_dob_month, 11);
    drawText(page1, 'patient_dob_day', testData.patient_dob_day, 11);
    drawText(page1, 'patient_dob_year', testData.patient_dob_year, 11);

    // Page 2
    drawText(page2, 'exp1_provider', testData.exp1_provider, 9);
    drawText(page2, 'exp1_date', testData.exp1_date, 9);
    drawText(page2, 'exp1_amount', testData.exp1_amount, 9);
    drawText(page2, 'exp2_provider', testData.exp2_provider, 9);
    drawText(page2, 'exp2_date', testData.exp2_date, 9);
    drawText(page2, 'exp2_amount', testData.exp2_amount, 9);
    drawText(page2, 'exp3_provider', testData.exp3_provider, 9);
    drawText(page2, 'exp3_date', testData.exp3_date, 9);
    drawText(page2, 'exp3_amount', testData.exp3_amount, 9);

    drawText(page2, 'total_amount', testData.total_amount, 11);

    if (testData.dental === 'yes') drawCheck(page2, 'dental_yes');
    else drawCheck(page2, 'dental_no');

    if (testData.vision === 'yes') drawCheck(page2, 'vision_yes');
    else drawCheck(page2, 'vision_no');

    drawText(page2, 'sig_date', testData.sig_date, 10);

    fs.writeFileSync('test-raw-coords.pdf', await pdfDoc.save());
    console.log('Generated: test-raw-coords.pdf');
}

generateTestPDF().catch(console.error);
