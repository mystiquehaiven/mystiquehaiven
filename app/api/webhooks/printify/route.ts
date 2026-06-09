import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { Resend } from "resend";
import { createRedemptionCode } from "@/lib/redemptionCodes";

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── HMAC Verification ────────────────────────────────────────────────────────

function verifyPrintifySignature(
  rawBody: string,
  receivedSignature: string | null
): boolean {
  if (!receivedSignature) return false;

  const secret = process.env.PRINTIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[printify/webhook] PRINTIFY_WEBHOOK_SECRET is not set");
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(receivedSignature, "hex")
    );
  } catch {
    return false;
  }
}

// ─── Payload Types ────────────────────────────────────────────────────────────

interface PrintifyOrderPayload {
  type: string;
  resource: {
    id: string;
    data: {
      id: string;
      address_to: {
        email: string;
        first_name: string;
      };
      // other order fields we don't need
    };
  };
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-pfy-signature");

  // 1. Verify signature
  if (!verifyPrintifySignature(rawBody, signature)) {
    console.warn("[printify/webhook] Invalid signature — request rejected");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: PrintifyOrderPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // 2. Only process order created events
  if (payload.type !== "order:created") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const orderId = payload.resource?.data?.id;
  const email = payload.resource?.data?.address_to?.email;
  const firstName = payload.resource?.data?.address_to?.first_name ?? "there";

  if (!orderId || !email) {
    console.error("[printify/webhook] Missing orderId or email in payload", {
      orderId,
      email,
    });
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // 3. Check for duplicate — one code per order
  // (Printify retries on non-200, so we may receive the same event more than once)
  const { adminDb } = await import("../../../../lib/firebase-admin");
  const existing = await adminDb
    .collection("redemptionCodes")
    .where("orderId", "==", orderId)
    .limit(1)
    .get();

  if (!existing.empty) {
    console.log(`[printify/webhook] Code already issued for order ${orderId} — skipping`);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // 4. Generate and store the code
  let code: string;
  try {
    code = await createRedemptionCode(orderId);
  } catch (err) {
    console.error("[printify/webhook] Failed to create redemption code:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  // 5. Send email via Resend
  try {
    await resend.emails.send({
      from: "MystiqueHaiven <noreply@mystiquehaiven.com>",
      to: email,
      subject: "Your MystiqueHaiven Access Code",
      html: buildEmailHtml(firstName, code),
    });
  } catch (err) {
    // Email failure is non-fatal — code is already in Firestore.
    // Log it; you can manually resend or query Firestore for unclaimed codes.
    console.error(`[printify/webhook] Resend failed for order ${orderId}:`, err);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

// ─── Email Template ───────────────────────────────────────────────────────────

function buildEmailHtml(firstName: string, code: string): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background:#0d0d0d;font-family:'Georgia',serif;color:#e8d8c0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 20px;">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #2a2a2a;border-radius:4px;padding:48px 40px;">
            <tr>
              <td>
                <h1 style="margin:0 0 8px;font-size:22px;letter-spacing:0.08em;color:#c8a97e;text-transform:uppercase;">
                  MystiqueHaiven
                </h1>
                <p style="margin:0 0 32px;font-size:13px;color:#666;letter-spacing:0.12em;text-transform:uppercase;">
                  Your access code
                </p>

                <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#c0b090;">
                  Hi ${firstName},
                </p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:#a09080;">
                  Thank you for your purchase. Your order comes with full platform access —
                  one year of Standard membership plus a 60-day Exclusive trial.
                </p>
                <p style="margin:0 0 12px;font-size:13px;color:#666;letter-spacing:0.1em;text-transform:uppercase;">
                  Redemption code
                </p>
                <div style="background:#1a1a1a;border:1px solid #c8a97e33;border-radius:3px;padding:20px;text-align:center;margin-bottom:32px;">
                  <span style="font-family:'Courier New',monospace;font-size:22px;letter-spacing:0.18em;color:#c8a97e;">
                    ${code}
                  </span>
                </div>

                <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#807060;">
                  Visit
                  <a href="https://mystiquehaiven.com/redeem" style="color:#c8a97e;text-decoration:none;">
                    mystiquehaiven.com/redeem
                  </a>
                  to activate your access. This code expires in 90 days and can only be used once.
                </p>

                <p style="margin:0;font-size:13px;color:#4a4030;">
                  If you didn't make this purchase or have questions, reply to this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}