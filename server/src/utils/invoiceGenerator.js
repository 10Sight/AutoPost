import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import { logger } from "./logger.js";

/**
 * Generates a production-level professional PDF invoice
 * @param {Object} data - Invoice data
 * @param {string} data.invoiceId - Unique invoice number
 * @param {string} data.orgName - Name of the organization
 * @param {string} data.planName - Subscription plan name
 * @param {number} data.amount - Amount in cents
 * @param {Date} data.date - Billing date
 * @param {string} data.status - Payment status (paid, pending)
 * @param {string} outputPath - Path to save the PDF
 */
export const generateInvoicePDF = async (data, outputPath) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: "A4" });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            // 1. Generate QR Code Buffer
            // We use a structured JSON format to ensure modern scanners (Google Lens/iOS) 
            // identify this as data and show an information card rather than a web search.
            const qrData = {
                invoice_id: data.invoiceId,
                org_name: data.orgName,
                amount: `$${(data.amount / 100).toFixed(2)}`,
                date: new Date(data.date).toLocaleDateString(),
                status: data.status?.toUpperCase() || "PAID",
                verify_at: `https://10sight.com/v/${data.invoiceId}`
            };

            const qrBuffer = await QRCode.toBuffer(JSON.stringify(qrData, null, 2), {
                margin: 1,
                width: 300, // Slightly higher resolution for JSON density
                color: { 
                    dark: "#000000", 
                    light: "#ffffff" 
                },
                errorCorrectionLevel: 'H' // High error correction for dense data
            });

            // 2. Render Components
            generateHeader(doc);
            generateCustomerInformation(doc, data);
            generateInvoiceTable(doc, data);
            generateFooter(doc, qrBuffer);

            doc.end();
            
            stream.on("finish", () => {
                logger.info(`[Invoice] Generated successfully: ${data.invoiceId}`);
                resolve(outputPath);
            });
            
            stream.on("error", (err) => {
                logger.error(`[Invoice] Stream Error: ${err.message}`);
                reject(err);
            });

        } catch (error) {
            logger.error(`[Invoice] Generation Failed: ${error.message}`);
            reject(error);
        }
    });
};

function generateHeader(doc) {
    // --- Branding Logo (Text-based placeholder for scalability) ---
    doc.fillColor("#4f46e5")
       .fontSize(22)
       .font("Helvetica-Bold")
       .text("10SIGHT", 50, 45)
       .fontSize(10)
       .fillColor("#94a3b8")
       .font("Helvetica")
       .text("TECHNOLOGIES", 50, 68);

    // --- Company Info (Right-aligned) ---
    doc.fillColor("#444444")
       .fontSize(10)
       .text("10Sight Technologies Private Limited", 200, 50, { align: "right" })
       .text("Suite 404, Tech Plaza, Silicon Valley", 200, 65, { align: "right" })
       .text("California, USA - 94043", 200, 80, { align: "right" })
       .text("GSTIN: 29AAAAA0000A1Z5", 200, 95, { align: "right" })
       .moveDown();
}

function generateCustomerInformation(doc, data) {
    doc.fillColor("#1e293b")
       .fontSize(20)
       .font("Helvetica-Bold")
       .text("INVOICE", 50, 160);

    generateHr(doc, 185);

    const customerInfoTop = 200;

    // --- Bill To ---
    doc.fontSize(10)
       .font("Helvetica-Bold")
       .text("Bill To:", 50, customerInfoTop)
       .font("Helvetica")
       .text(data.orgName, 50, customerInfoTop + 15)
       .text("Enterprise Customer", 50, customerInfoTop + 30)
       .text("Organization Dashboard", 50, customerInfoTop + 45);

    // --- Invoice Meta ---
    doc.font("Helvetica-Bold")
       .text("Invoice ID:", 300, customerInfoTop)
       .font("Helvetica")
       .text(data.invoiceId, 400, customerInfoTop)
       .font("Helvetica-Bold")
       .text("Date:", 300, customerInfoTop + 15)
       .font("Helvetica")
       .text(new Date(data.date).toLocaleDateString(), 400, customerInfoTop + 15)
       .font("Helvetica-Bold")
       .text("Status:", 300, customerInfoTop + 30)
       .fillColor(data.status === 'paid' ? "#16a34a" : "#ca8a04")
       .text(data.status?.toUpperCase() || "PAID", 400, customerInfoTop + 30)
       .moveDown();

    generateHr(doc, 252);
}

function generateInvoiceTable(doc, data) {
    let i;
    const invoiceTableTop = 330;

    doc.font("Helvetica-Bold");
    generateTableRow(
        doc,
        invoiceTableTop,
        "Plan Description",
        "Quantity",
        "Unit Cost",
        "Line Total"
    );
    generateHr(doc, invoiceTableTop + 20);
    doc.font("Helvetica");

    // --- Plan Row ---
    generateTableRow(
        doc,
        invoiceTableTop + 30,
        `${data.planName.toUpperCase()} Plan Subscription (Monthly)`,
        "1",
        `$${(data.amount / 100).toFixed(2)}`,
        `$${(data.amount / 100).toFixed(2)}`
    );

    generateHr(doc, invoiceTableTop + 56);

    // --- Summary Section ---
    const subtotalPosition = invoiceTableTop + 80;
    generateTableRow(
        doc,
        subtotalPosition,
        "",
        "",
        "Subtotal",
        `$${(data.amount / 100).toFixed(2)}`
    );

    const taxPosition = subtotalPosition + 20;
    generateTableRow(
        doc,
        taxPosition,
        "",
        "",
        "Tax (0%)",
        "$0.00"
    );

    const duePosition = taxPosition + 25;
    doc.font("Helvetica-Bold");
    generateTableRow(
        doc,
        duePosition,
        "",
        "",
        "Total Amount",
        `$${(data.amount / 100).toFixed(2)}`
    );
    doc.font("Helvetica");
}

function generateFooter(doc, qrBuffer) {
    // --- QR Code Section ---
    doc.fontSize(10)
       .fillColor("#94a3b8")
       .text("Scan for Verification", 50, 680);
    
    doc.image(qrBuffer, 50, 700, { width: 70 });

    // --- Closing Text ---
    doc.fontSize(10)
       .fillColor("#444444")
       .text(
           "Thank you for choosing 10Sight Technologies. For support, contact support@10sight.com",
           50,
           780,
           { align: "center", width: 500 }
       );
}

function generateTableRow(doc, y, item, quantity, unitCost, total) {
    doc.fontSize(10)
       .text(item, 50, y)
       .text(quantity, 280, y, { width: 90, align: "right" })
       .text(unitCost, 370, y, { width: 90, align: "right" })
       .text(total, 0, y, { align: "right" });
}

function generateHr(doc, y) {
    doc.strokeColor("#e2e8f0")
       .lineWidth(1)
       .moveTo(50, y)
       .lineTo(550, y)
       .stroke();
}
