import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";

const TIER_CONFIG = {
  threshold: {
    price: 0.99,
    currency: "USD",
    durationDays: 2,
    label: "Threshold — 2 Day Access",
  },
  standard: {
    price: 14.99, // update to your actual price
    currency: "USD",
    durationDays: 30,
    label: "Standard — Monthly",
  },
  exclusive: {
    price: 19.99, // update to your actual price
    currency: "USD",
    durationDays: 30,
    label: "Exclusive — Monthly",
  },
} as const;

type Tier = keyof typeof TIER_CONFIG;

export async function POST(req: NextRequest) {
  // Verify Firebase auth token
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userId: string;
  let userEmail: string;

  try {
    const decoded = await getAuth().verifyIdToken(token);
    userId = decoded.uid;
    userEmail = decoded.email ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { tier } = await req.json();

  if (!tier || !(tier in TIER_CONFIG)) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const config = TIER_CONFIG[tier as Tier];

  // Check if user already has an active subscription
  const userSnap = await adminDb.collection("users").doc(userId).get();
  const currentSub = userSnap.data()?.subscription;

  if (
    currentSub?.status === "active" &&
    currentSub?.expiresAt?.toDate() > new Date()
  ) {
    return NextResponse.json(
      { error: "Active subscription already exists" },
      { status: 400 }
    );
  }

  // Create BTCPay invoice
  const response = await fetch(
    `${process.env.BTCPAY_HOST}/api/v1/stores/${process.env.BTCPAY_STORE_ID}/invoices`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${process.env.BTCPAY_API_KEY}`,
      },
      body: JSON.stringify({
        amount: config.price,
        currency: config.currency,
        metadata: {
          userId,
          userEmail,
          tier,
          durationDays: config.durationDays,
          orderId: `${userId}-${tier}-${Date.now()}`,
        },
        checkout: {
          redirectURL: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe/success`,
          redirectAutomatically: true,
        },
        receipt: {
          enabled: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("BTCPay invoice creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }

  const invoice = await response.json();

  // Store pending invoice on user doc so we can reference it
  await adminDb.collection("users").doc(userId).update({
    "subscription.btcpayInvoiceId": invoice.id,
    "subscription.status": "pending",
    "subscription.updatedAt": new Date(),
  });

  return NextResponse.json({
    invoiceUrl: invoice.checkoutLink,
    invoiceId: invoice.id,
  });
}