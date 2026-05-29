import nodemailer from "nodemailer";

/**
 * Utility helper to send emails.
 * Falls back to console logs in development if SMTP details are missing.
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const isMock = 
    !process.env.SMTP_HOST || 
    process.env.SMTP_HOST === "smtp.mailtrap.io" || 
    process.env.SMTP_USER === "mock_smtp_user";

  if (isMock) {
    console.log("\n✉️  [MOCK EMAIL DISPATCH]");
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${text || html}\n`);
    return { mock: true, message: "Mock email successfully logged to console" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Zive App" <noreply@zive.com>',
      to,
      subject,
      text,
      html
    });

    return info;
  } catch (error) {
    console.error("Nodemailer Email Dispatch Error: ", error);
    // Return mock success so register flow doesn't throw a fatal 500 error
    console.log("\n✉️  [FALLBACK MOCK EMAIL DISPATCH]");
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${text || html}\n`);
    return { mock: true, error: error.message };
  }
};
