import nodemailer from "nodemailer";

/**
 * Sends a professional, redesigned welcome email to a new employee.
 * @param {string} employeeEmail - The recipient's email address.
 * @param {string} employeePassword - The temporary password for the employee.
 * @param {string} employeeRole - The role assigned to the employee.
 * @param {string} companyName - The name of the company creating the account.
 * @param {string} appName - The name of your application.
 * @param {string} loginUrl - The URL to your application's login page.
 */
export const sendEmployeeCredentialEmail = async (
  employeeEmail,
  employeeRole,
  employeePassword,
  companyName,
  appName = "Secure Scan",
  loginUrl = "#"
) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "kiran.rathod24@vit.edu", // Your Gmail address
        pass: "klzz iebo aspi jckt",   // Your App Password
      },
    });

    // --- FURTHER ENHANCED & UPDATED HTML TEMPLATE ---
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're Invited to Join ${companyName}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
            body {
                margin: 0;
                padding: 0;
                font-family: 'Manrope', sans-serif;
                background-color: #f8f9fa;
                -webkit-font-smoothing: antialiased;
            }
            .wrapper {
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08);
                border: 1px solid #dee2e6;
            }
            .header {
                background: linear-gradient(120deg, #2A3A52 0%, #1D283A 100%);
                padding: 50px 40px;
                text-align: center;
                color: #ffffff;
            }
            .header h1 {
                margin: 0;
                font-size: 32px;
                font-weight: 700;
                letter-spacing: -1px;
            }
            .header p {
                margin: 10px 0 0;
                font-size: 16px;
                opacity: 0.8;
            }
            .content {
                padding: 40px;
                color: #343a40;
                line-height: 1.7;
            }
            .content .greeting {
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 24px;
            }
            .content p {
                margin: 0 0 20px;
                font-size: 16px;
            }
            .credentials-card {
                background-color: #f8f9fa;
                border-radius: 10px;
                padding: 15px 25px;
                margin: 30px 0;
                border: 1px solid #e9ecef;
            }
            .credential-item {
                padding: 16px 0;
                font-size: 16px;
                border-bottom: 1px solid #e9ecef;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .credential-item:last-child {
                border-bottom: none;
            }
            .credential-item .label {
                color: #6c757d;
                font-weight: 400;
            }
            .credential-item .value {
                color: #212529;
                font-weight: 600;
                word-break: break-all;
                text-align: right;
            }
            .cta-button {
                display: block;
                width: fit-content;
                margin: 30px auto 0;
                background: #007bff;
                color: #ffffff;
                padding: 15px 35px;
                font-size: 16px;
                font-weight: 600;
                text-decoration: none;
                border-radius: 50px;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(0, 123, 255, 0.2);
            }
            .cta-button:hover {
                background: #0069d9;
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0, 123, 255, 0.3);
            }
            .footer {
                padding: 30px 40px;
                text-align: center;
                font-size: 13px;
                color: #adb5bd;
                border-top: 1px solid #e9ecef;
            }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="header">
                <h1>Your Account is Ready</h1>
                <p>An invitation from <b>${companyName}</b></p>
            </div>
            <div class="content">
                <p class="greeting">Hi there,</p>
                <p>Welcome to <b>${appName}</b>! An account has been created for you to collaborate with the <b>${companyName}</b> team. </p>
                <p>Here are your login details. Please keep them secure:</p>
                
                <div class="credentials-card">
                    <div class="credential-item">
                        <span class="label">Email Address</span>
                        <span class="value">: ${employeeEmail}</span>
                    </div>
                    <div class="credential-item">
                        <span class="label">Temporary Password</span>
                        <span class="value">: ${employeePassword}</span>
                    </div>
                    <div class="credential-item">
                        <span class="label">Assigned Role</span>
                        <span class="value">: ${employeeRole}</span>
                    </div>
                </div>
                <p style="margin-top: 40px; font-size: 14px; text-align: center; color: #6c757d;">For security, we highly recommend changing your password after your first login.</p>
            </div>
            <div class="footer">
                <p>If you did not expect this, please ignore this email.</p>
                <p>&copy; ${new Date().getFullYear()} ${appName}. All Rights Reserved.</p>
            </div>
        </div>
    </body>
    </html>`;

    const info = await transporter.sendMail({
      from: `"${appName}" <no-reply@secure-scan.com>`,
      to: employeeEmail,
      subject: `[${appName}] You've been invited by ${companyName}`,
      html,
    });

    return info;

  } catch (error) {
    console.error("Error sending credential email:", error);
    return null;
  }
};

