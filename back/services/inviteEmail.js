const nodemailer = require("nodemailer");
const APP_NAME = "secureScan";

function buildTransportOptions() {
  const host = String(process.env.SMTP_HOST || "").trim();
  const service = String(process.env.SMTP_SERVICE || "").trim();
  const user = String(process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();
  const pass = String(process.env.SMTP_PASS || process.env.EMAIL_PASS || "").trim();
  const explicitPort = String(process.env.SMTP_PORT || "").trim();
  const explicitSecure = String(process.env.SMTP_SECURE || "").trim().toLowerCase();

  if (!user || !pass) {
    return null;
  }

  if (service) {
    return {
      service,
      auth: { user, pass },
    };
  }

  if (host) {
    return {
      host,
      port: Number(explicitPort || 587),
      secure: explicitSecure === "true",
      auth: { user, pass },
    };
  }

  if (/@gmail\.com$/i.test(user)) {
    return {
      host: "smtp.gmail.com",
      port: Number(explicitPort || 465),
      secure: explicitSecure ? explicitSecure === "true" : true,
      auth: { user, pass },
    };
  }

  return null;
}

function getMissingInviteEnvFields() {
  const service = String(process.env.SMTP_SERVICE || "").trim();
  const host = String(process.env.SMTP_HOST || "").trim();
  const user = String(process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();
  const pass = String(process.env.SMTP_PASS || process.env.EMAIL_PASS || "").trim();

  const missing = [];
  if (!user) missing.push("SMTP_USER");
  if (!pass) missing.push("SMTP_PASS");
  if (!service && !host) missing.push("SMTP_SERVICE or SMTP_HOST");
  return missing;
}

function getInviteTransporter() {
  const transportOptions = buildTransportOptions();
  if (!transportOptions) {
    return null;
  }

  return nodemailer.createTransport(transportOptions);
}

function buildInviteEmailMarkup({ organizationName, inviteLink, to, role }) {
  const text = [
    `You have been invited to join ${organizationName} on ${APP_NAME}.`,
    "",
    `Invited email: ${to}`,
    `Assigned role: ${role || "EMPLOYEE"}`,
    `Organization: ${organizationName}`,
    "",
    "Use the link below to set your password and activate your account:",
    inviteLink,
    "",
    `For security, ${APP_NAME} does not send passwords by email.`,
    "You will create your password securely from the invite link.",
    "",
    "If you were not expecting this invite, you can ignore this email.",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;background:#f8fafc;padding:24px;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="padding:28px 28px 20px;background:#0f172a;color:#e2e8f0;">
          <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#93c5fd;font-weight:700;">${APP_NAME} Invite</div>
          <h2 style="margin:10px 0 0;font-size:26px;line-height:1.2;">Join ${organizationName}</h2>
          <p style="margin:10px 0 0;color:#cbd5e1;">Your organization has invited you to access ${APP_NAME} securely.</p>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 14px;">This invite is reserved for <strong>${to}</strong>.</p>
          <div style="margin:0 0 18px;padding:14px 16px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
            <p style="margin:0 0 8px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.14em;font-weight:700;">Invitation details</p>
            <p style="margin:0 0 6px;"><strong>Organization:</strong> ${organizationName}</p>
            <p style="margin:0;"><strong>Assigned role:</strong> ${role || "EMPLOYEE"}</p>
          </div>
          <p style="margin:0 0 18px;">Use the secure link below to create your password and activate your account.</p>
          <p style="margin:0 0 20px;">
            <a href="${inviteLink}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">
              Set Password & Join Team
            </a>
          </p>
          <div style="padding:14px 16px;border-radius:12px;background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a8a;">
            For security, ${APP_NAME} does not send passwords by email. You will create your own password after opening the invite link.
          </div>
          <p style="margin:18px 0 8px;color:#475569;">If the button does not work, copy this link into your browser:</p>
          <p style="margin:0;word-break:break-all;color:#334155;">${inviteLink}</p>
          <p style="margin:18px 0 0;color:#64748b;">If you were not expecting this invite, you can safely ignore this email.</p>
        </div>
      </div>
    </div>
  `;

  return { text, html };
}

async function sendOrganizationInviteEmail({ to, organizationName, inviteLink, role }) {
  const transporter = getInviteTransporter();
  const smtpUser = String(process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();

  if (!transporter) {
    const missing = getMissingInviteEnvFields();
    console.warn(
      `Invite email skipped: SMTP is not configured. Missing ${missing.length ? missing.join(", ") : "required SMTP settings"}.`
    );
    return {
      delivered: false,
      skipped: true,
      message: `SMTP is not configured. Missing ${missing.length ? missing.join(", ") : "required SMTP settings"}.`,
      suggestion: "Set SMTP_HOST/SMTP_USER/SMTP_PASS or SMTP_SERVICE with valid credentials.",
      missing,
    };
  }

  const fromAddress = process.env.SMTP_FROM || smtpUser;
  const { text, html } = buildInviteEmailMarkup({ organizationName, inviteLink, to, role });

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject: `You're invited to join ${organizationName} on ${APP_NAME}`,
      text,
      html,
    });

    return {
      delivered: true,
      skipped: false,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Failed to send organization invite email:", error.message);
    const message = String(error.message || "Email delivery failed.");
    const suggestion =
      /invalid login|auth|credentials/i.test(message)
        ? "Check SMTP credentials. For Gmail, use an App Password and keep 2-Step Verification enabled."
        : /ENOTFOUND|ECONNREFUSED|ETIMEDOUT/i.test(message)
          ? "Check SMTP host, port, and network access to the mail server."
          : "Verify SMTP configuration and try sending the invite again.";

    return {
      delivered: false,
      skipped: false,
      message,
      suggestion,
    };
  }
}

module.exports = {
  sendOrganizationInviteEmail,
};
