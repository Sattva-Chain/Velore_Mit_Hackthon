const nodemailer = require("nodemailer");

const APP_NAME = "secureScan";

function buildOAuthTransportOptions() {
  const user = String(process.env.GOOGLE_OAUTH_USER || "").trim();
  const clientId = String(process.env.GOOGLE_OAUTH_CLIENT_ID || "").trim();
  const clientSecret = String(process.env.GOOGLE_OAUTH_CLIENT_SECRET || "").trim();
  const refreshToken = String(process.env.GOOGLE_OAUTH_REFRESH_TOKEN || "").trim();
  const accessToken = String(process.env.GOOGLE_OAUTH_ACCESS_TOKEN || "").trim();

  if (!user || !clientId || !clientSecret || !refreshToken) {
    return null;
  }

  return {
    service: "gmail",
    auth: {
      type: "OAuth2",
      user,
      clientId,
      clientSecret,
      refreshToken,
      accessToken: accessToken || undefined,
    },
  };
}

function buildSmtpTransportOptions() {
  const host = String(process.env.SMTP_HOST || "").trim();
  const user = String(process.env.SMTP_USER || "").trim();
  const pass = String(process.env.SMTP_PASS || "").trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "").trim().toLowerCase() === "true";

  if (!user || !pass) return null;
  if (host) return { host, port, secure, auth: { user, pass } };
  return null;
}

function getTaskTransporter() {
  const transportOptions = buildOAuthTransportOptions() || buildSmtpTransportOptions();
  if (!transportOptions) return null;
  return nodemailer.createTransport(transportOptions);
}

function getTaskMailerFromAddress() {
  return (
    String(process.env.SMTP_FROM || "").trim() ||
    String(process.env.GOOGLE_OAUTH_USER || "").trim() ||
    String(process.env.SMTP_USER || "").trim() ||
    null
  );
}

function buildTaskAssignmentEmailMarkup(payload) {
  const text = [
    `A remediation task has been assigned to you in ${APP_NAME}.`,
    "",
    `Title: ${payload.title}`,
    `Repository: ${payload.repoName || "N/A"}`,
    `Branch: ${payload.branch || "N/A"}`,
    `File: ${payload.filePath || "N/A"}`,
    `Line: ${payload.lineNumber ?? "N/A"}`,
    `Issue: ${payload.secretType || "Secret exposure"}`,
    `Severity: ${payload.severity || "MEDIUM"}`,
    `Due date: ${payload.dueDateLabel || "Not set"}`,
    `Assigned by: ${payload.assignedBy || "secureScan"}`,
    payload.asanaAssignedLabel ? `Asana assignment: ${payload.asanaAssignedLabel}` : "Asana assignment: task created from secureScan workflow",
    payload.asanaAssignmentMessage ? `Asana status: ${payload.asanaAssignmentMessage}` : "",
    "",
    "Recommended remediation:",
    payload.recommendation || "Rotate the exposed secret, move it into environment variables, and remove it from source control.",
    "",
    payload.asanaTaskUrl ? `Asana task: ${payload.asanaTaskUrl}` : "",
    payload.internalReference ? `Internal reference: ${payload.internalReference}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;background:#f8fafc;padding:24px;">
      <div style="max-width:660px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="padding:28px;background:#0f172a;color:#e2e8f0;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="display:flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:14px;background:rgba(37,99,235,0.14);border:1px solid rgba(96,165,250,0.28);">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="7" cy="12" r="3.5" fill="#f87171"></circle>
                <circle cx="12" cy="7" r="3.5" fill="#fb923c"></circle>
                <circle cx="17" cy="12" r="3.5" fill="#f472b6"></circle>
              </svg>
            </div>
            <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#93c5fd;font-weight:700;">${APP_NAME} x Asana Remediation Task</div>
          </div>
          <h2 style="margin:10px 0 0;font-size:24px;line-height:1.2;">${payload.title}</h2>
          <p style="margin:10px 0 0;color:#cbd5e1;">A vulnerability remediation task has been assigned for follow-up and prepared for Asana tracking.</p>
        </div>
        <div style="padding:28px;">
          <div style="margin:0 0 18px;padding:14px 16px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
            <p style="margin:0 0 8px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.14em;font-weight:700;">Task details</p>
            <p style="margin:0 0 6px;"><strong>Repository:</strong> ${payload.repoName || "N/A"}</p>
            <p style="margin:0 0 6px;"><strong>Branch:</strong> ${payload.branch || "N/A"}</p>
            <p style="margin:0 0 6px;"><strong>File:</strong> ${payload.filePath || "N/A"}</p>
            <p style="margin:0 0 6px;"><strong>Line:</strong> ${payload.lineNumber ?? "N/A"}</p>
            <p style="margin:0 0 6px;"><strong>Issue:</strong> ${payload.secretType || "Secret exposure"}</p>
            <p style="margin:0 0 6px;"><strong>Severity:</strong> ${payload.severity || "MEDIUM"}</p>
            <p style="margin:0;"><strong>Due date:</strong> ${payload.dueDateLabel || "Not set"}</p>
          </div>
          <div style="margin:0 0 18px;padding:14px 16px;border-radius:12px;background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a8a;">
            <strong>Assigned by:</strong> ${payload.assignedBy || APP_NAME}
          </div>
          <div style="margin:0 0 18px;padding:14px 16px;border-radius:12px;background:#fff7ed;border:1px solid #fdba74;color:#9a3412;">
            <strong>Asana assignment:</strong> ${payload.asanaAssignedLabel || "This task was created from the SecureScan to Asana remediation workflow."}
          </div>
          ${payload.asanaAssignmentMessage ? `<div style="margin:0 0 18px;padding:14px 16px;border-radius:12px;background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;"><strong>Asana status:</strong> ${payload.asanaAssignmentMessage}</div>` : ""}
          <p style="margin:0 0 8px;"><strong>Recommended remediation</strong></p>
          <p style="margin:0 0 18px;color:#334155;">${payload.recommendation || "Rotate the exposed secret, move it into environment variables, and remove it from source control."}</p>
          ${payload.asanaTaskUrl ? `<p style="margin:0 0 10px;"><a href="${payload.asanaTaskUrl}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">Open in Asana</a></p>` : ""}
          ${payload.internalReference ? `<p style="margin:0;color:#64748b;">Internal reference: ${payload.internalReference}</p>` : ""}
        </div>
      </div>
    </div>
  `;

  return { text, html };
}

async function sendTaskAssignmentEmail(payload) {
  if (!payload?.to) {
    return {
      delivered: false,
      skipped: true,
      message: "Assignee email is missing.",
    };
  }

  const transporter = getTaskTransporter();
  const from = getTaskMailerFromAddress();

  if (!transporter || !from) {
    return {
      delivered: false,
      skipped: true,
      message: "Email transport is not configured.",
    };
  }

  const markup = buildTaskAssignmentEmailMarkup(payload);

  try {
    const info = await transporter.sendMail({
      from,
      to: payload.to,
      subject: `[${APP_NAME}] ${payload.title}`,
      text: markup.text,
      html: markup.html,
    });

    return {
      delivered: true,
      skipped: false,
      messageId: info.messageId,
    };
  } catch (error) {
    return {
      delivered: false,
      skipped: false,
      message: String(error?.message || "Email delivery failed."),
    };
  }
}

module.exports = {
  sendTaskAssignmentEmail,
};
