export type SendAlertEmailPayload = {
  to: string[];
  ruleName: string;
  alertType: string;
  title: string;
  message: string;
  companyName: string;
  metadata: Record<string, unknown>;
};

export async function sendAlertEmail(
  payload: SendAlertEmailPayload
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || "alerts@logisphere.io";

  if (!apiKey) {
    console.warn(
      "RESEND_API_KEY not configured. Alert emails will not be sent."
    );
    return;
  }

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f5f5f5; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { padding: 20px; background: white; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; }
    .footer { padding: 10px; font-size: 12px; color: #999; text-align: center; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th { text-align: left; padding: 8px; border-bottom: 2px solid #e0e0e0; font-weight: bold; }
    td { padding: 8px; border-bottom: 1px solid #f0f0f0; }
    .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
    .badge { display: inline-block; padding: 4px 8px; background: #ff6b6b; color: white; border-radius: 3px; font-size: 12px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0; color: #333;">[Logisphere Alert] ${payload.title}</h2>
      <p style="margin: 5px 0 0 0; color: #666;">From: ${payload.companyName}</p>
    </div>
    <div class="content">
      <p style="font-size: 16px; margin: 15px 0;">${payload.message}</p>

      <h3 style="margin-top: 25px; margin-bottom: 10px;">Alert Details</h3>
      <table>
        <tr>
          <th>Rule Name</th>
          <td>${escapeHtml(payload.ruleName)}</td>
        </tr>
        <tr>
          <th>Alert Type</th>
          <td><span class="badge">${escapeHtml(payload.alertType)}</span></td>
        </tr>
        ${Object.entries(payload.metadata)
          .map(
            ([key, value]) => `
        <tr>
          <th>${escapeHtml(String(key))}</th>
          <td>${escapeHtml(String(value))}</td>
        </tr>
        `
          )
          .join("")}
      </table>

      <p style="margin-top: 25px; text-align: center;">
        <a href="https://logisphere.io/settings/alerts" class="button">View Alert Rules</a>
      </p>
    </div>
    <div class="footer">
      <p>This is an automated alert from Logisphere. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom,
        to: payload.to,
        subject: `[Logisphere Alert] ${payload.title}`,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(
        "Failed to send alert email via Resend:",
        response.status,
        error
      );
      return;
    }

    console.log(
      `Alert email sent successfully to ${payload.to.length} recipient(s)`
    );
  } catch (error) {
    console.error("Error sending alert email:", error);
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
