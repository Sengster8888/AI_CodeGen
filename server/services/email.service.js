import nodemailer from 'nodemailer';

export const sendOTPEmail = async (toEmail, otpCode) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("WARNING: GMAIL_USER or GMAIL_APP_PASSWORD is not set. OTP will NOT be sent.");
    // In dev, you might want to log the OTP so you can still test it without sending an email
    console.log(`[DEV MODE] Generated OTP for ${toEmail}: ${otpCode}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"AI CodeGen Auth" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'Your AI CodeGen Login Code',
    text: `Your login code is: ${otpCode}. It will expire in 5 minutes.`,
    html: `
      <div style="background-color: #f4f5f7; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 40px 30px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); text-align: center;">
          
          <!-- Header / Logo -->
          <div style="margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 800; margin: 0; display: inline-block;">
              <span style="color: #4A90E2;">AI</span> CodeGen
            </h1>
          </div>

          <!-- Title -->
          <h2 style="color: #1a1a1a; font-size: 22px; font-weight: 600; margin: 0 0 20px 0;">Verify your AI CodeGen sign-up</h2>
          
          <!-- Description -->
          <p style="color: #4a4a4a; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
            We have received a sign-up attempt with the following code. Please enter it in the browser window where you started signing up for AI CodeGen.
          </p>

          <!-- OTP Box -->
          <div style="background-color: #f4f5f7; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; font-size: 42px; font-weight: 700; letter-spacing: 6px; margin: 0;">${otpCode}</h1>
          </div>

          <!-- Expiration Note -->
          <p style="color: #7a7a7a; font-size: 14px; line-height: 1.6; margin: 0 0 40px 0;">
            If you did not attempt to sign up but received this email, please disregard it. The code will remain active for 5 minutes.
          </p>

          <!-- Divider -->
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 0 0 30px 0;" />Bearer TokenBearer Token

          <!-- Footer Description -->
          <p style="color: #7a7a7a; font-size: 14px; margin: 0 0 20px 0;">
            AI CodeGen, an effortless AI coding solution with all the features you need.
          </p>

          <!-- Copyright -->
          <p style="color: #9a9a9a; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} AI CodeGen. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
