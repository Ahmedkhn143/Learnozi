import nodemailer from 'nodemailer';

// Helper to create transport if SMTP is configured
function getTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  if (process.env.GMAIL_USER && (process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD)) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  return null;
}

/**
 * Send 6-digit verification code to student email
 */
export async function sendVerificationEmail({ to, name, code }) {
  const transporter = getTransporter();

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #0d1117; color: #e6edf3; border-radius: 12px; overflow: hidden; border: 1px solid #30363d;">
      <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Learnozi</h1>
        <p style="color: #e0e7ff; margin: 6px 0 0; font-size: 14px;">AI-Powered Study & Productivity Platform</p>
      </div>

      <div style="padding: 32px 24px; background: #161b22;">
        <h2 style="margin-top: 0; color: #ffffff; font-size: 20px;">Welcome, ${name || 'Student'}! 👋</h2>
        <p style="color: #8b949e; line-height: 1.6; font-size: 15px;">
          Thank you for registering on <strong>Learnozi</strong>. To activate your student account and access your AI study tools, please enter the verification code below:
        </p>

        <div style="background: #0d1117; border: 2px dashed #6366f1; border-radius: 10px; padding: 20px; text-align: center; margin: 28px 0;">
          <span style="font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; color: #818cf8; font-weight: 600; display: block; margin-bottom: 8px;">Your Verification Passcode</span>
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; font-family: monospace;">${code}</span>
          <span style="display: block; margin-top: 8px; font-size: 12px; color: #8b949e;">Valid for 15 minutes</span>
        </div>

        <p style="color: #8b949e; font-size: 14px; line-height: 1.5;">
          Enter this code on the verification screen to verify your email and unlock your personalized study dashboard, flashcards, and AI explainer.
        </p>
        
        <p style="color: #6e7681; font-size: 12px; margin-top: 24px; border-top: 1px solid #21262d; padding-top: 16px;">
          If you didn't create an account with Learnozi, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Learnozi Student Portal" <no-reply@learnozi.com>',
        to,
        subject: `Learnozi Verification Code: ${code}`,
        text: `Welcome to Learnozi! Your student account verification code is: ${code}. Valid for 15 minutes.`,
        html: htmlContent,
      });
      console.log('Verification email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId, code };
    } catch (err) {
      console.error('SMTP email sending failed, falling back to in-app simulation:', err.message);
    }
  }

  // If no SMTP configured, log cleanly and return simulated success
  console.log(`\n========================================\n[LOCAL EMAIL DISPATCH] To: ${to}\nVerification Code: ${code}\n========================================\n`);
  return { success: true, simulated: true, code };
}

/**
 * Send password reset code/token to student email
 */
export async function sendPasswordResetEmail({ to, name, code }) {
  const transporter = getTransporter();

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #0d1117; color: #e6edf3; border-radius: 12px; overflow: hidden; border: 1px solid #30363d;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;">Learnozi Security</h1>
        <p style="color: #fef3c7; margin: 6px 0 0; font-size: 14px;">Password Reset Request</p>
      </div>

      <div style="padding: 32px 24px; background: #161b22;">
        <h2 style="margin-top: 0; color: #ffffff; font-size: 20px;">Hello ${name || 'Student'},</h2>
        <p style="color: #8b949e; line-height: 1.6; font-size: 15px;">
          We received a request to reset the password for your Learnozi account. Use the verification passcode below to choose a new password:
        </p>

        <div style="background: #0d1117; border: 2px dashed #f59e0b; border-radius: 10px; padding: 20px; text-align: center; margin: 28px 0;">
          <span style="font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; color: #fbbf24; font-weight: 600; display: block; margin-bottom: 8px;">Your Password Reset Code</span>
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #f59e0b; font-family: monospace;">${code}</span>
          <span style="display: block; margin-top: 8px; font-size: 12px; color: #8b949e;">Valid for 15 minutes</span>
        </div>

        <p style="color: #6e7681; font-size: 12px; margin-top: 24px; border-top: 1px solid #21262d; padding-top: 16px;">
          If you did not request a password reset, please ignore this email or reach out to support.
        </p>
      </div>
    </div>
  `;

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Learnozi Security" <no-reply@learnozi.com>',
        to,
        subject: `Learnozi Password Reset Code: ${code}`,
        text: `Your Learnozi password reset code is: ${code}. Valid for 15 minutes.`,
        html: htmlContent,
      });
      console.log('Password reset email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId, code };
    } catch (err) {
      console.error('SMTP reset email sending failed:', err.message);
    }
  }

  console.log(`\n========================================\n[LOCAL EMAIL RESET DISPATCH] To: ${to}\nReset Code: ${code}\n========================================\n`);
  return { success: true, simulated: true, code };
}
