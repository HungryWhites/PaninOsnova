const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (!transporter) {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      console.log("SMTP not configured. Emails will be logged to console.");
      return null;
    }

    transporter = nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: parseInt(port) === 465,
      auth: { user, pass },
    });
  }
  return transporter;
}

async function sendMail({ to, subject, text, html, attachments }) {
  const t = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@promstroy.ru";

  if (!t) {
    console.log("=== EMAIL (console mode) ===");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text: ${text || "(html only)"}`);
    if (attachments) console.log(`Attachments: ${attachments.map((a) => a.filename).join(", ")}`);
    console.log("============================");
    return { messageId: "console-" + Date.now() };
  }

  return await t.sendMail({ from, to, subject, text, html, attachments });
}

module.exports = { sendMail };
