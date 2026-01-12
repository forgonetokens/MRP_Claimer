// Test script to generate sample Anthem PDF for alignment checking
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');

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
    patient_signature: { type: 'signature', x: 120, y: 70, maxWidth: 283, maxHeight: 30 },
    patient_signature_date: { type: 'date', x: 469, y: 75, totalWidth: 109, digits: 8 },
    member_signature: { type: 'signature', x: 120, y: 44, maxWidth: 284, maxHeight: 30 },
    member_signature_date: { type: 'date', x: 468, y: 46, totalWidth: 109, digits: 8 }
};

async function generateTestPDF() {
    const existingPdfBytes = fs.readFileSync('Anthem_Claim_Form.pdf');
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const page1 = pages[0];

    // Remove instructions page
    if (pages.length > 1) {
        pdfDoc.removePage(1);
    }

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const textColor = rgb(0, 0, 0);

    // Helper function to draw text at baseline
    function drawText(fieldKey, text) {
        const field = FORM_FIELDS[fieldKey];
        if (!field || !text) return;
        page1.drawText(String(text), {
            x: field.x,
            y: field.y,
            size: 10,
            font,
            color: textColor
        });
    }

    // Helper function to draw date with spaced digits
    function drawDate(fieldKey, dateStr) {
        const field = FORM_FIELDS[fieldKey];
        if (!field || !dateStr) return;
        const digits = String(dateStr).replace(/\D/g, '');
        if (digits.length === 0) return;

        const numDigits = field.digits || 8;
        const spacing = field.totalWidth / numDigits;

        for (let i = 0; i < digits.length && i < numDigits; i++) {
            page1.drawText(digits[i], {
                x: field.x + (i * spacing) + (spacing / 2) - 3,
                y: field.y,
                size: 10,
                font,
                color: textColor
            });
        }
    }

    // Helper function to draw checkbox (centered at x, y)
    function drawCheckbox(fieldKey) {
        const field = FORM_FIELDS[fieldKey];
        if (!field) return;
        const checkSize = 10;
        page1.drawText('X', {
            x: field.x - (checkSize / 2),
            y: field.y - (checkSize / 2),
            size: checkSize,
            font,
            color: textColor
        });
    }

    // Section 1: Member Information
    drawText('member_last_name', 'TESTLASTNAME');
    drawText('member_first_name', 'TESTFIRST');
    drawText('member_mi', 'M');
    drawText('member_id', 'ABC123456789');
    drawText('group_no', 'GRP001');
    drawText('member_street', '123 Test Street Apt 4B');
    drawText('member_city', 'New York');
    drawText('member_state', 'NY');
    drawText('member_zip', '10001');

    // Section 2: Patient Information
    drawText('patient_last_name', 'TESTLASTNAME');
    drawText('patient_first_name', 'TESTFIRST');
    drawText('patient_mi', 'M');
    drawCheckbox('patient_sex_male');
    drawDate('patient_dob', '01151990');
    drawCheckbox('relationship_self');

    // Section 3: Diagnosis
    drawText('illness', 'Annual checkup and routine exam');
    drawDate('accident_date', '12252025');

    // Section 4: Work-related
    drawCheckbox('work_related_no');

    // Section 5: Other Insurance
    drawCheckbox('other_insurance_no');

    // Section 6: Medicare
    drawCheckbox('medicare_no');

    // Section 7: Signature dates
    drawDate('patient_signature_date', '01122026');
    drawDate('member_signature_date', '01122026');

    // Draw "SAMPLE SIGNATURE" text where signatures would go
    const patientSig = FORM_FIELDS.patient_signature;
    page1.drawText('SAMPLE SIGNATURE', {
        x: patientSig.x,
        y: patientSig.y,
        size: 10,
        font,
        color: textColor
    });

    const memberSig = FORM_FIELDS.member_signature;
    page1.drawText('SAMPLE SIGNATURE', {
        x: memberSig.x,
        y: memberSig.y,
        size: 10,
        font,
        color: textColor
    });

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync('Anthem-Test-Alignment.pdf', pdfBytes);
    console.log('Generated: Anthem-Test-Alignment.pdf');
}

generateTestPDF().catch(console.error);
