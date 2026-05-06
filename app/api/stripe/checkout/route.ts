import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminAuth } from "@/lib/firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

const PRICE_IDS = {
  standard: process.env.STRIPE_PRICE_STANDARD!,
  exclusive: process.env.STRIPE_PRICE_EXCLUSIVE!,
  TwoDay: process.env.STRIPE_PRICE_2DAY!,
} as const;

type PriceKey = keyof typeof PRICE_IDS;

export async function POST(req: NextRequest) {
  // Verify Firebase token
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.split("Bearer ")[1];

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { priceKey } = await req.json() as { priceKey: PriceKey };

  if (!priceKey || !(priceKey in PRICE_IDS)) {
    return NextResponse.json({ error: "Invalid price key" }, { status: 400 });
  }

  const priceId = PRICE_IDS[priceKey];
  const is2Day = priceKey === "TwoDay";

  const session = await stripe.checkout.sessions.create({
    mode: is2Day ? "payment" : "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: uid, // ties the Stripe session back to the Firebase user
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscribe`,
    // Pre-fill email if you store it — optional but improves UX
    // customer_email: userEmail,
    payment_intent_data: is2Day
      ? { metadata: { firebaseUid: uid } }
      : undefined,
    subscription_data: !is2Day
      ? { metadata: { firebaseUid: uid } }
      : undefined,
  });

  return NextResponse.json({ url: session.url });
}