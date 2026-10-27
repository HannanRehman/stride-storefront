// The approved black/white draft design, shared by all runtime notifications.
// Accept plain values only: callers cannot inject raw HTML into a message.
export const escapeEmail = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

export type EmailLayout = {
  brand: string;
  subject: string;
  preheader: string;
  heading: string;
  paragraphs: string[];
  action: string;
  url: string;
  contact: string;
  details?: [string, string][];
  unsubscribe?: string;
};

export function emailLayout(message: EmailLayout) {
  const e = escapeEmail;
  const details = message.details?.length
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;margin:22px 0;table-layout:fixed">${message.details
        .map(
          ([label, value]) =>
            `<tr><td style="padding:10px 0;border-bottom:1px solid #e5e5e5;color:#555555;vertical-align:top">${e(label)}</td><td style="padding:10px 0 10px 16px;border-bottom:1px solid #e5e5e5;text-align:right;vertical-align:top">${e(value)}</td></tr>`,
        )
        .join("")}</table>`
    : "";
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${e(message.subject)}</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#111111;line-height:1.6;overflow-wrap:anywhere">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${e(message.preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;table-layout:fixed">
<tr><td style="padding:26px 28px;background:#111111;color:#f5f5f5;font-size:26px;font-weight:bold;letter-spacing:-1px">${e(message.brand)}</td></tr>
<tr><td style="padding:32px 28px 36px"><h1 style="margin:0 0 22px;font-size:30px;line-height:1.15;letter-spacing:-0.8px">${e(message.heading)}</h1>
${message.paragraphs.map((p) => `<p style="margin:0 0 16px;font-size:15px">${e(p)}</p>`).join("\n")}${details}
<p style="margin:26px 0"><a href="${e(message.url)}" style="display:inline-block;padding:15px 24px;background:#111111;border:1px solid #111111;color:#ffffff;font-weight:bold;font-size:15px;line-height:20px;text-decoration:none;text-align:center">${e(message.action)}</a></p>
<p style="margin:0;font-size:12px;color:#555555">Button not working? Open this link in your browser:<br><a href="${e(message.url)}" style="color:#111111;text-decoration:underline;word-break:break-all">${e(message.url)}</a></p></td></tr>
<tr><td style="padding:22px 28px;border-top:1px solid #e5e5e5;font-size:12px;color:#555555">Sent by ${e(message.brand)}.<br>Need help? <a href="${e(message.contact)}" style="color:#111111;text-decoration:underline">Contact the store</a>${message.unsubscribe ? `<p style="margin:16px 0 0"><a href="${e(message.unsubscribe)}" style="color:#555555;text-decoration:underline">Stop launch updates</a></p>` : ""}</td></tr>
</table></td></tr></table></body></html>`;
  const text = [
    message.brand,
    message.heading,
    ...message.paragraphs,
    ...(message.details || []).map(([label, value]) => `${label}: ${value}`),
    `${message.action}: ${message.url}`,
    `Contact the store: ${message.contact}`,
    ...(message.unsubscribe
      ? [`Stop launch updates: ${message.unsubscribe}`]
      : []),
  ].join("\n\n");
  return { subject: message.subject, html, text };
}
