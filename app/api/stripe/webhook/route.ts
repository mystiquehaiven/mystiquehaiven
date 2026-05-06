import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

// Map Stripe Price IDs to your internal tier names.
// Replace these with your actual Price IDs from Stripe dashboard.
const PRICE_TIER_MAP: Record<string, "standard" | "exclusive"> = {
  [process.env.STRIPE_PRICE_STANDARD!]: "standard",
  [process.env.STRIPE_PRICE_EXCLUSIVE!]: "exclusive",
  [process.env.STRIPE_PRICE_2DAY!]: "standard", // 2-day trial grants standard access
};

// Duration in ms for the 2-day trial.
const TWO_DAY_MS = 48 * 60 * 60 * 1000;

async function setSubscriptionAccess(
  uid: string,
  tier: "standard" | "exclusive" | "free",
  opts: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string | null;
    status: "active" | "cancelled" | "trial";
    trialExpiresAt?: number | null; // unix ms, only for 2-day
  }
) {
  const userRef = adminDb.collection("users").doc(uid);

  await userRef.set(
    {
      subscription: {
        tier,
        status: opts.status,
        stripeCustomerId: opts.stripeCustomerId ?? null,
        stripeSubscriptionId: opts.stripeSubscriptionId ?? null,
        trialExpiresAt: opts.trialExpiresAt ?? null,
        updatedAt: Date.now(),
      },
    },
    { merge: true }
  );

  // Only put persistent tier in the custom claim.
  // Trial access is intentionally NOT in the claim — gated API routes
  // check Firestore for trial validity so there's no stale-claim problem.
  if (opts.status !== "trial") {
    await adminAuth.setCustomUserClaims(uid, { tier });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ── Checkout completed ───────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const uid = session.client_reference_id;

        if (!uid) {
          console.error("checkout.session.completed: missing client_reference_id");
          break;
        }

        const priceId =
          session.line_items?.data[0]?.price?.id ??
          // line_items not expanded on the event object by default — retrieve session
          await stripe.checkout.sessions
            .retrieve(session.id, { expand: ["line_items"] })
            .then((s) => s.line_items?.data[0]?.price?.id);

        const tier = priceId ? PRICE_TIER_MAP[priceId] : undefined;

        if (!tier) {
          console.error("checkout.session.completed: unrecognised price ID", priceId);
          break;
        }

        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ?? undefined;

        // One-time payment = 2-day trial (mode: "payment")
        if (session.mode === "payment") {
          await setSubscriptionAccess(uid, tier, {
            stripeCustomerId: customerId,
            stripeSubscriptionId: null,
            status: "trial",
            trialExpiresAt: Date.now() + TWO_DAY_MS,
          });
          break;
        }

        // Recurring subscription (mode: "subscription")
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id ?? null;

        await setSubscriptionAccess(uid, tier, {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          status: "active",
        });

        break;
      }

      // ── Subscription updated (upgrade / downgrade / renewal) ─────────────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;

        // Look up UID by stripeCustomerId stored in Firestore
        const snapshot = await adminDb
          .collection("users")
          .where("subscription.stripeCustomerId", "==", sub.customer)
          .limit(1)
          .get();

        if (snapshot.empty) {
          console.error("subscription.updated: no user found for customer", sub.customer);
          break;
        }

        const uid = snapshot.docs[0].id;
        const priceId = sub.items.data[0]?.price?.id;
        const tier = priceId ? PRICE_TIER_MAP[priceId] : undefined;

        if (!tier) {
          console.error("subscription.updated: unrecognised price ID", priceId);
          break;
        }

        const status = sub.status === "active" ? "active" : "cancelled";

        await setSubscriptionAccess(uid, tier, {
          stripeCustomerId: sub.customer as string,
          stripeSubscriptionId: sub.id,
          status,
        });

        break;
      }

      // ── Subscription cancelled / expired ─────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        const snapshot = await adminDb
          .collection("users")
          .where("subscription.stripeCustomerId", "==", sub.customer)
          .limit(1)
          .get();

        if (snapshot.empty) {
          console.error("subscription.deleted: no user found for customer", sub.customer);
          break;
        }

        const uid = snapshot.docs[0].id;

        await setSubscriptionAccess(uid, "free", {
          stripeCustomerId: sub.customer as string,
          stripeSubscriptionId: sub.id,
          status: "cancelled",
        });

        break;
      }

      default:
        // Ignore unhandled event types
        break;
    }
  } catch (err) {
    console.error(`Error handling event ${event.type}:`, err);
    // Return 500 so Stripe retries the webhook
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// Stripe requires the raw request body for signature verification.
// This disables Next.js body parsing for this route.
export const config = {
  api: { bodyParser: false },
};