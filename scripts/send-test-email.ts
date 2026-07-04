/**
 * One-off: send a test invite email through Resend to verify the API key +
 * from-domain are working.  Run:  pnpm exec tsx scripts/send-test-email.ts
 */
import "dotenv/config";
import { Resend } from "resend";

const TO = "nandan7602831377@gmail.com";
const from = process.env.EMAIL_FROM || "Wanderly <onboarding@resend.dev>";
const apiKey = process.env.RESEND_API_KEY;

const acceptUrl = "http://localhost:3000/invite/demo-token";
const inviterName = "Nandan";
const tripTitle = "Puri";

const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#faf7f0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#2a2a2a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f0;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
          <tr><td style="padding:0 24px 16px;font-size:22px;font-weight:700;">✎ Wanderly</td></tr>
          <tr><td style="background:#ffffff;border:2px solid #2a2a2a;border-radius:16px;padding:28px 24px;">
            <p style="margin:0 0 6px;font-size:13px;color:#5a7d2e;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Trip invitation</p>
            <h1 style="margin:0 0 12px;font-size:26px;line-height:1.2;">You're invited to join<br/>&ldquo;${tripTitle}&rdquo;</h1>
            <p style="margin:0 0 24px;font-size:15px;color:#5a5a5a;line-height:1.5;">
              <strong>${inviterName}</strong> wants you on this trip — plan the days together and share every photo &amp; video in one place.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="border-radius:12px;background:#5a7d2e;">
                <a href="${acceptUrl}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">Join the trip →</a>
              </td>
            </tr></table>
            <p style="margin:22px 0 0;font-size:12px;color:#9a9a9a;line-height:1.5;">
              Or paste this link into your browser:<br/>
              <a href="${acceptUrl}" style="color:#3f5f97;word-break:break-all;">${acceptUrl}</a>
            </p>
          </td></tr>
          <tr><td style="padding:16px 24px;font-size:12px;color:#9a9a9a;">
            This is a test invite from Wanderly. If you weren't expecting it, you can ignore this email.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

async function main() {
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set in .env");
    process.exit(1);
  }
  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: TO,
    subject: `${inviterName} invited you to “${tripTitle}” on Wanderly`,
    html,
  });
  if (error) {
    console.error("✗ Resend error:", JSON.stringify(error, null, 2));
    process.exit(1);
  }
  console.log(`✓ Sent to ${TO} from "${from}" — message id: ${data?.id}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
