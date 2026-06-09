import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../lib/firebase-admin";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RedemptionCodeStatus = "active" | "redeemed" | "expired";

export interface RedemptionCodeGrant {
  standardDays: number;
  exclusiveDays: number;
}

export interface RedemptionCode {
  code: string;
  orderId: string;
  issuedAt: Timestamp;
  expiresAt: Timestamp; // code must be redeemed before this date (90 days)
  redeemedAt: Timestamp | null;
  redeemedBy: string | null; // uid
  status: RedemptionCodeStatus;
  grant: RedemptionCodeGrant;
}

export interface UserSubscription {
  tier: "free" | "standard" | "exclusive";
  status: "active" | "expired" | null;
  standardExpiresAt: Timestamp | null;
  exclusiveExpiresAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CODE_EXPIRY_DAYS = 90;
const DEFAULT_GRANT: RedemptionCodeGrant = {
  standardDays: 365,
  exclusiveDays: 60,
};

// ─── Code Generation ──────────────────────────────────────────────────────────

/**
 * Generates a formatted redemption code: MHVN-XXXX-XXXX-XXXX
 * No ambiguous chars (0/O, I/1) to avoid transcription errors.
 */
export function generateRedemptionCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segment = (len: number) =>
    Array.from({ length: len }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("");

  return `MHVN-${segment(4)}-${segment(4)}-${segment(4)}`;
}

/**
 * Writes a new redemption code document to Firestore.
 * Called by the Printify webhook handler after order confirmation.
 */
export async function createRedemptionCode(orderId: string): Promise<string> {
  const code = generateRedemptionCode();
  const now = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(
    now.toMillis() + CODE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );

  const codeDoc: RedemptionCode = {
    code,
    orderId,
    issuedAt: now,
    expiresAt,
    redeemedAt: null,
    redeemedBy: null,
    status: "active",
    grant: DEFAULT_GRANT,
  };

  await adminDb.collection("redemptionCodes").doc(code).set(codeDoc);
  return code;
}

// ─── Code Redemption ──────────────────────────────────────────────────────────

export type RedeemResult =
  | { success: true }
  | { success: false; error: "not_found" | "already_redeemed" | "expired" | "server_error" };

/**
 * Validates and applies a redemption code to a user account.
 * Fully atomic — both the user grant and code status update occur in a single transaction.
 * Handles stacking — extends existing expiry dates rather than overwriting them.
 */
export async function redeemCode(code: string, uid: string): Promise<RedeemResult> {
  const normalizedCode = code.toUpperCase().trim();
  const codeRef = adminDb.collection("redemptionCodes").doc(normalizedCode);
  const userRef = adminDb.collection("users").doc(uid);

  try {
    const result = await adminDb.runTransaction(async (tx) => {
      const [codeSnap, userSnap] = await Promise.all([
        tx.get(codeRef),
        tx.get(userRef),
      ]);

      // ─── Validate code ──────────────────────────────────────────────────

      if (!codeSnap.exists) {
        return { success: false, error: "not_found" } as RedeemResult;
      }

      const codeData = codeSnap.data() as RedemptionCode;

      if (codeData.status === "redeemed") {
        return { success: false, error: "already_redeemed" } as RedeemResult;
      }

      if (
        codeData.status === "expired" ||
        codeData.expiresAt.toMillis() < Date.now()
      ) {
        tx.update(codeRef, { status: "expired" });
        return { success: false, error: "expired" } as RedeemResult;
      }

      // ─── Validate user ──────────────────────────────────────────────────

      if (!userSnap.exists) {
        return { success: false, error: "server_error" } as RedeemResult;
      }

      // ─── Calculate stacked expiry dates ─────────────────────────────────

      const userData = userSnap.data()!;
      const existing: UserSubscription = userData.subscription ?? {
        tier: "free",
        status: null,
        standardExpiresAt: null,
        exclusiveExpiresAt: null,
        updatedAt: null,
      };

      const now = Date.now();
      const { standardDays, exclusiveDays } = codeData.grant;

      const standardBase = Math.max(
        existing.standardExpiresAt?.toMillis() ?? 0,
        now
      );
      const exclusiveBase = Math.max(
        existing.exclusiveExpiresAt?.toMillis() ?? 0,
        now
      );

      const newStandardExpiresAt = Timestamp.fromMillis(
        standardBase + standardDays * 24 * 60 * 60 * 1000
      );
      const newExclusiveExpiresAt = Timestamp.fromMillis(
        exclusiveBase + exclusiveDays * 24 * 60 * 60 * 1000
      );

      const redeemedAt = Timestamp.now();

      // ─── Atomic writes ───────────────────────────────────────────────────

      tx.update(userRef, {
        subscription: {
          tier: "exclusive",
          status: "active",
          standardExpiresAt: newStandardExpiresAt,
          exclusiveExpiresAt: newExclusiveExpiresAt,
          updatedAt: redeemedAt,
        },
      });

      tx.update(codeRef, {
        status: "redeemed",
        redeemedAt,
        redeemedBy: uid,
      });

      return { success: true } as RedeemResult;
    });

    return result;
  } catch (err) {
    console.error("[redeemCode] Transaction failed:", err);
    return { success: false, error: "server_error" };
  }
}