import { CONTACT_EMAIL } from "@/lib/site";
import { LOGO_PNG_BASE64 } from "./email-logo";

/** Content-ID the HTML refers to; the image itself travels with the message. */
export const LOGO_CID = "carepass-logo";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const SERIF = "Georgia,'Times New Roman',Times,serif";
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'SFMono-Regular',Menlo,Consolas,'Liberation Mono',monospace";

/** The sign-in email: subject, HTML and plain text. Table layout with inline styles so it holds up in every mail app. */
export function otpEmail(otp: string, to: string, minutes = 5, opts: { inlineLogo?: boolean } = {}) {
  const logoSrc = opts.inlineLogo === false ? `data:image/png;base64,${LOGO_PNG_BASE64}` : `cid:${LOGO_CID}`;
  const site = (process.env.BETTER_AUTH_URL ?? "https://carepass.app").replace(/\/$/, "");
  const code = esc(otp);
  const spaced = code.length === 6 ? `${code.slice(0, 3)}&nbsp;${code.slice(3)}` : code;
  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<title>Your CarePass sign-in code</title>
</head>
<body style="margin:0;padding:0;background:#F6F1E6;-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Your CarePass code is ${code}. It expires in ${minutes} minutes.&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F6F1E6;">
<tr><td align="center" style="padding:40px 16px 48px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;">
    <!-- brand -->
    <tr><td style="padding:0 4px 22px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
        <td width="36" height="36" style="width:36px;height:36px;"><img src="${logoSrc}" width="36" height="36" alt="" style="display:block;width:36px;height:36px;border:0;border-radius:10px;" /></td>
        <td style="padding-left:10px;font-family:${SERIF};font-size:22px;font-weight:600;color:#16241d;letter-spacing:-0.2px;">CarePass</td>
      </tr></table>
    </td></tr>
    <!-- receipt card -->
    <tr><td style="background:#ffffff;border:1px solid #E3DAC5;border-radius:20px;padding:40px 36px 32px;">
      <p style="margin:0 0 10px;font-family:${SANS};font-size:12px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#007A4D;">Sign-in code</p>
      <h1 style="margin:0 0 14px;font-family:${SERIF};font-size:30px;line-height:1.15;font-weight:600;color:#16241d;">Here's your code</h1>
      <p style="margin:0 0 28px;font-family:${SANS};font-size:16px;line-height:1.6;color:#4a5a52;">Enter this code to sign in to CarePass. It works once and expires in <strong style="color:#16241d;">${minutes} minutes</strong>.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
        <td align="center" style="background:#F6F1E6;border:2px dashed #CFC4AA;border-radius:14px;padding:26px 12px;">
          <span style="font-family:${MONO};font-size:40px;font-weight:700;letter-spacing:6px;color:#0A3D2B;">${spaced}</span>
        </td>
      </tr></table>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:30px;"><tr><td style="border-top:1px dashed #CFC4AA;font-size:0;line-height:0;height:1px;">&nbsp;</td></tr></table>
      <p style="margin:22px 0 0;font-family:${SANS};font-size:14px;line-height:1.65;color:#6b7a72;"><strong style="color:#16241d;">Keep it to yourself.</strong> CarePass will never ask you for this code by phone, chat or email. If you didn't try to sign in, you can ignore this message and nothing will happen.</p>
    </td></tr>
    <!-- footer -->
    <tr><td align="center" style="padding:26px 12px 0;font-family:${SANS};font-size:12px;line-height:1.7;color:#8a948d;">
      Sent to ${esc(to)}<br />
      <a href="${site}/terms" style="color:#6b7a72;text-decoration:underline;">Terms</a> &nbsp;·&nbsp; <a href="${site}/privacy" style="color:#6b7a72;text-decoration:underline;">Privacy</a> &nbsp;·&nbsp; <a href="mailto:${CONTACT_EMAIL}" style="color:#6b7a72;text-decoration:underline;">${CONTACT_EMAIL}</a><br />
      CarePass · Care for family back home
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
  const text = `Your CarePass sign-in code is ${otp}\n\nIt works once and expires in ${minutes} minutes.\n\nKeep it to yourself. CarePass will never ask for this code by phone, chat or email. If you didn't try to sign in, you can ignore this message.\n\nCarePass · Care for family back home\n${site}`;
  const attachments = [{ filename: "carepass.png", content: LOGO_PNG_BASE64, content_type: "image/png", content_id: LOGO_CID, disposition: "inline" }];
  return { attachments, subject: `${otp} is your CarePass sign-in code`, html, text };
}
