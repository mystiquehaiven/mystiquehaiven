import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import * as crypto from "crypto";

// BTCPay sends the raw body for HMAC verification — must disable body parsing
export const config = {
  api: { bodyParser: false },
};

function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("btcpay-sig1") ?? "";

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const webhookSecret = process.env.BTCPAY_WEBHOOK_SECRET!;

  // BTCPay signature format is "sha256=<hash>"
  const signatureHash = signature.replace("sha256=", "");

  if (!verifyWebhookSignature(rawBody, signatureHash, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const { type, invoiceId, metadata } = event;

  // metadata is set by us when creating the invoice
  const { userId, tier, durationDays } = metadata ?? {};

  if (!userId || !tier) {
    // Not one of our invoices or malformed — ignore silently
    return NextResponse.json({ received: true });
  }

  const userRef = adminDb.collection("users").doc(userId);

  if (type === "InvoiceSettled") {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + Number(durationDays));

    await userRef.update({
      subscription: {
        tier,
        status: "active",
        paidAt: now,
        expiresAt,
        btcpayInvoiceId: invoiceId,
        updatedAt: now,
      },
    });
  }

  if (type === "InvoiceExpired" || type === "InvoiceInvalid") {
    // Invoice was never paid — only reset if this invoice matches current record
    const snap = await userRef.get();
    const current = snap.data()?.subscription;

    if (current?.btcpayInvoiceId === invoiceId) {
      await userRef.update({
        "subscription.status": "unpaid",
        "subscription.updatedAt": new Date(),
      });
    }
  }

  return NextResponse.json({ received: true });
}