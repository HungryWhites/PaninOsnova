const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const invoicesDir = path.join(__dirname, "../invoices");
if (!fs.existsSync(invoicesDir)) {
  fs.mkdirSync(invoicesDir, { recursive: true });
}

function generateInvoice(order, company) {
  return new Promise((resolve, reject) => {
    const fileName = `invoice-${order.orderNumber.replace(/[^a-zA-Z0-9а-яА-ЯёЁ-]/g, "_")}.pdf`;
    const filePath = path.join(invoicesDir, fileName);
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Header
    doc.fontSize(20).text("СЧЁТ НА ОПЛАТУ", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`${order.orderNumber}`, { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(10).text(`от ${new Date().toLocaleDateString("ru-RU")}`, { align: "center" });
    doc.moveDown(1.5);

    // Supplier info
    doc.fontSize(11).text("Поставщик:", { underline: true });
    doc.fontSize(10);
    doc.text('ООО ТД "ПРОМСТРОЙ"');
    doc.text("ИНН: 5401234567 / КПП: 540101001");
    doc.text("р/с 40702810000000012345 в ПАО Сбербанк");
    doc.text("БИК: 045004641, к/с 30101810500000000641");
    doc.moveDown(1);

    // Buyer info
    doc.fontSize(11).text("Покупатель:", { underline: true });
    doc.fontSize(10);
    doc.text(`${company.companyName}`);
    doc.text(`ИНН: ${company.inn}${company.kpp ? " / КПП: " + company.kpp : ""}`);
    if (company.bankName) {
      doc.text(`р/с ${company.settlAccount || "—"} в ${company.bankName}`);
      doc.text(`БИК: ${company.bik || "—"}, к/с ${company.corrAccount || "—"}`);
    }
    if (company.legalAddress) doc.text(`Адрес: ${company.legalAddress}`);
    doc.moveDown(1.5);

    // Table header
    const tableTop = doc.y;
    const colX = [50, 70, 310, 370, 430, 490];
    doc.fontSize(9).font("Helvetica-Bold");
    doc.text("№", colX[0], tableTop, { width: 20 });
    doc.text("Наименование", colX[1], tableTop, { width: 240 });
    doc.text("Кол-во", colX[2], tableTop, { width: 60 });
    doc.text("Цена", colX[3], tableTop, { width: 60 });
    doc.text("Сумма", colX[4], tableTop, { width: 70 });
    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();
    doc.font("Helvetica");

    // Items
    let y = tableTop + 22;
    const items = order.OrderItems || [];
    items.forEach((item, idx) => {
      const name = item.Product?.name || item.productName || "—";
      const qty = item.quantity;
      const price = parseFloat(item.price);
      const sum = qty * price;
      doc.fontSize(9);
      doc.text(`${idx + 1}`, colX[0], y, { width: 20 });
      doc.text(name, colX[1], y, { width: 240 });
      doc.text(`${qty}`, colX[2], y, { width: 60 });
      doc.text(`${price.toFixed(2)}`, colX[3], y, { width: 60 });
      doc.text(`${sum.toFixed(2)}`, colX[4], y, { width: 70 });
      y += 18;
      if (y > 720) {
        doc.addPage();
        y = 50;
      }
    });

    doc.moveTo(50, y).lineTo(545, y).stroke();
    y += 10;

    // Total
    const total = parseFloat(order.totalAmount);
    doc.fontSize(11).font("Helvetica-Bold");
    doc.text(`Итого к оплате: ${total.toFixed(2)} руб.`, 300, y, { width: 245, align: "right" });
    doc.font("Helvetica");
    doc.moveDown(2);

    // Footer
    doc.fontSize(9).text("Счёт действителен в течение 5 банковских дней.", 50);

    doc.end();

    stream.on("finish", () => resolve({ filePath, fileName }));
    stream.on("error", reject);
  });
}

module.exports = { generateInvoice };
