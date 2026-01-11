#!/usr/bin/env node
// Test new alignment tool coordinates (already in pdf-lib format)

const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

// New coordinates from alignment tool - already pdf-lib ready (bottom-left origin)
const FIELDS = {
    // Page 1
    participant_last: { page: 1, x: 171.5, y: 387.9 },
    participant_first: { page: 1, x: 335.6, y: 387.9 },
    participant_mi: { page: 1, x: 519.6, y: 387.9 },
    ssn: { page: 1, x: 185, y: 359.6 },
    gender_male: { page: 1, x: 443.3, y: 360.7, type: 'checkbox' },
    gender_female: { page: 1, x: 525.3, y: 360.7, type: 'checkbox' },
    dob_month: { page: 1, x: 171.5, y: 330.4 },
    dob_day: { page: 1, x: 268.7, y: 330.4 },
    dob_year: { page: 1, x: 362.8, y: 330.4 },
    street: { page: 1, x: 108.7, y: 301.1 },
    city: { page: 1, x: 330.4, y: 301.1 },
    state: { page: 1, x: 471.5, y: 301.1 },
    zip: { page: 1, x: 508.1, y: 301.1 },
    phone: { page: 1, x: 134.9, y: 271.8 },
    email: { page: 1, x: 341.9, y: 271.8 },
    other_coverage: { page: 1, x: 268.7, y: 242.5 },
    patient_last: { page: 1, x: 134.9, y: 214.3 },
    patient_first: { page: 1, x: 316.8, y: 214.3 },
    patient_mi: { page: 1, x: 526.4, y: 214.3 },
    relationship: { page: 1, x: 200.7, y: 180.9 },
    patient_dob_month: { page: 1, x: 171.5, y: 153.7 },
    patient_dob_day: { page: 1, x: 275, y: 153.7 },
    patient_dob_year: { page: 1, x: 358.6, y: 153.7 },

    // Page 2
    exp1_provider: { page: 2, x: 48.1, y: 679.5 },
    exp1_date: { page: 2, x: 292.7, y: 679.5 },
    exp1_amount: { page: 2, x: 467.3, y: 679.5 },
    exp2_provider: { page: 2, x: 48.1, y: 660.7 },
    exp2_date: { page: 2, x: 292.7, y: 660.7 },
    exp2_amount: { page: 2, x: 467.3, y: 660.7 },
    exp3_provider: { page: 2, x: 48.1, y: 641.9 },
    exp3_date: { page: 2, x: 292.7, y: 641.9 },
    exp3_amount: { page: 2, x: 467.3, y: 641.9 },
    total_amount: { page: 2, x: 467.3, y: 508.1 },
    dental_yes: { page: 2, x: 287.5, y: 473.6, type: 'checkbox' },
    dental_no: { page: 2, x: 330.4, y: 474.6, type: 'checkbox' },
    vision_yes: { page: 2, x: 469.4, y: 475.7, type: 'checkbox' },
    vision_no: { page: 2, x: 519.6, y: 474.6, type: 'checkbox' },
    sig_date: { page: 2, x: 469.4, y: 142.2 },
};

// Test data
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
    expenses: [
        { provider: 'City Medical Center', date: '12/15/2025', amount: '$150.00' },
        { provider: 'Downtown Pharmacy', date: '12/16/2025', amount: '$45.50' },
        { provider: 'Vision Plus Optometry', date: '12/20/2025', amount: '$225.00' },
    ],
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
    const textColor = rgb(0, 0, 0);

    // Direct draw - no coordinate conversion needed
    function drawText(page, fieldId, text, fontSize = 10) {
        const field = FIELDS[fieldId];
        if (!field || !text) return;
        page.drawText(text, { x: field.x, y: field.y, size: fontSize, font, color: textColor });
    }

    function drawCheckbox(page, fieldId) {
        const field = FIELDS[fieldId];
        if (!field) return;
        page.drawText('X', { x: field.x, y: field.y, size: 12, font, color: textColor });
    }

    // Page 1
    drawText(page1, 'participant_last', testData.participant_last, 11);
    drawText(page1, 'participant_first', testData.participant_first, 11);
    drawText(page1, 'participant_mi', testData.participant_mi, 11);
    drawText(page1, 'ssn', testData.ssn, 11);

    if (testData.gender === 'male') drawCheckbox(page1, 'gender_male');
    else drawCheckbox(page1, 'gender_female');

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

    // Page 2 - Expenses
    drawText(page2, 'exp1_provider', testData.expenses[0].provider, 9);
    drawText(page2, 'exp1_date', testData.expenses[0].date, 9);
    drawText(page2, 'exp1_amount', testData.expenses[0].amount, 9);

    drawText(page2, 'exp2_provider', testData.expenses[1].provider, 9);
    drawText(page2, 'exp2_date', testData.expenses[1].date, 9);
    drawText(page2, 'exp2_amount', testData.expenses[1].amount, 9);

    drawText(page2, 'exp3_provider', testData.expenses[2].provider, 9);
    drawText(page2, 'exp3_date', testData.expenses[2].date, 9);
    drawText(page2, 'exp3_amount', testData.expenses[2].amount, 9);

    drawText(page2, 'total_amount', testData.total_amount, 11);

    if (testData.dental === 'yes') drawCheckbox(page2, 'dental_yes');
    else drawCheckbox(page2, 'dental_no');

    if (testData.vision === 'yes') drawCheckbox(page2, 'vision_yes');
    else drawCheckbox(page2, 'vision_no');

    drawText(page2, 'sig_date', testData.sig_date, 10);

    // Save
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync('test-new-coords.pdf', pdfBytes);
    console.log('Generated: test-new-coords.pdf');
}

generateTestPDF().catch(console.error);
