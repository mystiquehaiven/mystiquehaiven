import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Resend } from "resend";



const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  // Verify this is called by Vercel cron, not a random request
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const windowStart = now;
  const windowEnd = now + FIVE_DAYS_MS;

  // Fetch all active subscriptions
  const snapshot = await adminDb
    .collection("users")
    .where("subscription.status", "==", "active")
    .get();

  const results = { sent: 0, skipped: 0, errors: 0 };

  await Promise.all(
    snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      const sub = data.subscription;
      const email = data.email;

      if (!email || !sub?.expiresAt) {
        results.skipped++;
        return;
      }

      const expiryMs =
        typeof sub.expiresAt === "object" && typeof sub.expiresAt.toMillis === "function"
          ? sub.expiresAt.toMillis()
          : typeof sub.expiresAt === "number"
          ? sub.expiresAt
          : null;

      if (expiryMs == null) {
        results.skipped++;
        return;
      }

      // Only email if expiry falls within the next 5 days
      if (expiryMs < windowStart || expiryMs > windowEnd) {
        results.skipped++;
        return;
      }

      // Don't re-send if we already sent a reminder for this invoice
      if (sub.renewalReminderSent === sub.btcpayInvoiceId) {
        results.skipped++;
        return;
      }

      const expiryDate = new Date(expiryMs).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const tierLabel =
        sub.tier === "exclusive" ? "Exclusive" : sub.tier === "standard" ? "Standard" : "Threshold";

      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: email,
          subject: "Your MYSTIQUE hAIven membership is expiring soon",
          html: buildEmailHtml({ email, tierLabel, expiryDate }),
        });

        // Mark reminder sent so we don't double-send
        await adminDb.collection("users").doc(docSnap.id).update({
          "subscription.renewalReminderSent": sub.btcpayInvoiceId,
        });

        results.sent++;
      } catch (err) {
        console.error(`Failed to send renewal reminder to ${email}:`, err);
        results.errors++;
      }
    })
  );

  return NextResponse.json(results);
}

function buildEmailHtml({
  email,
  tierLabel,
  expiryDate,
}: {
  email: string;
  tierLabel: string;
  expiryDate: string;
}) {
  const renewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/subscribe`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Top rule -->
          <tr>
            <td style="padding-bottom:40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:1px;background:linear-gradient(to right,transparent,#c8a97e44,transparent);"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding-bottom:40px;">
              <p style="margin:0;font-family:Georgia,serif;font-size:11px;letter-spacing:0.4em;color:#c8a97e;text-transform:uppercase;">
                MYSTIQUE hAIven
              </p>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <h1 style="margin:0;font-family:Georgia,serif;font-size:36px;font-weight:300;color:#f0e6d3;line-height:1.2;letter-spacing:0.02em;">
                Your Access<br/>
                <em style="color:#c8a97e;font-style:italic;">Expires Soon</em>
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td align="center" style="padding-bottom:40px;">
              <p style="margin:0;font-family:Georgia,serif;font-size:16px;color:#888;line-height:1.8;font-weight:300;text-align:center;">
                Your <strong style="color:#c8a97e;font-weight:normal;">${tierLabel}</strong> membership expires on
                <strong style="color:#e8e0d5;font-weight:normal;">${expiryDate}</strong>.
                To continue your access without interruption, renew your subscription before that date.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding-bottom:48px;">
              <a href="${renewUrl}"
                style="display:inline-block;padding:14px 40px;border:1px solid #c8a97e88;color:#c8a97e;font-family:Georgia,serif;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;text-decoration:none;">
                Renew Membership
              </a>
            </td>
          </tr>

          <!-- Note -->
          <tr>
            <td align="center" style="padding-bottom:40px;">
              <p style="margin:0;font-family:Georgia,serif;font-size:13px;color:#444;line-height:1.7;text-align:center;">
                Payment is accepted in Bitcoin. If you have questions,<br/>
                reply to this email and we will assist you.
              </p>
            </td>
          </tr>

          <!-- Bottom rule -->
          <tr>
            <td style="padding-bottom:32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:1px;background:linear-gradient(to right,transparent,#c8a97e44,transparent);"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center">
              <p style="margin:0;font-family:Georgia,serif;font-size:11px;color:#333;letter-spacing:0.1em;">
                This reminder was sent to ${email} because your membership is approaching expiry.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}