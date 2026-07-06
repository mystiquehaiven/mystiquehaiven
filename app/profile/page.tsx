"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import Footer from "@/components/footer";

type SubscriptionTier = "free" | "threshold" | "standard" | "exclusive";
type SubscriptionStatus = "active" | "cancelled" | "pending" | "unpaid" | "trial" | null;

interface Subscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  btcpayInvoiceId: string | null;
  expiresAt: { toMillis: () => number } | number | null;
  trialExpiresAt: { toMillis: () => number } | number | null;
  paidAt: { toDate: () => Date } | null;
  updatedAt: { toDate: () => Date } | null;
}

interface UserData {
  email: string;
  ageVerified: boolean;
  createdAt: { toDate: () => Date };
  subscription: Subscription | null;
}

const TIER_LABELS: Record<SubscriptionTier, string> = {
  free: "No Membership",
  threshold: "Threshold",
  standard: "Standard",
  exclusive: "Exclusive",
};

function toMs(val: { toMillis: () => number } | number | null | undefined): number | null {
  if (val == null) return null;
  if (typeof val === "number") return val;
  if (typeof val.toMillis === "function") return val.toMillis();
  return null;
}

function getAccessState(sub: Subscription | null): {
  hasAccess: boolean;
  isTrial: boolean;
  isExclusive: boolean;
  expiresAt: number | null;
} {
  if (!sub) return { hasAccess: false, isTrial: false, isExclusive: false, expiresAt: null };

  const now = Date.now();

  if (sub.status === "active") {
    const expiryMs = toMs(sub.expiresAt);
    const hasAccess = expiryMs == null || expiryMs > now;
    return {
      hasAccess,
      isTrial: false,
      isExclusive: hasAccess && sub.tier === "exclusive",
      expiresAt: expiryMs,
    };
  }

  if (sub.status === "trial") {
    const expiryMs = toMs(sub.trialExpiresAt);
    const hasAccess = expiryMs != null && expiryMs > now;
    return {
      hasAccess,
      isTrial: hasAccess,
      isExclusive: false,
      expiresAt: expiryMs,
    };
  }

  return { hasAccess: false, isTrial: false, isExclusive: false, expiresAt: null };
}

function formatExpiry(expiresAt: number): string {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 1) return `Expires in ${days} days`;
  if (days === 1) return `Expires in 1 day ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

function formatDate(val: { toDate: () => Date } | null): string | null {
  if (!val) return null;
  return val.toDate().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function ProfilePage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/signin");
        return;
      }

      const unsubDoc = onSnapshot(doc(db, "users", user.uid), (snap) => {
        if (snap.exists()) setUserData(snap.data() as UserData);
        setLoading(false);
      });

      return () => unsubDoc();
    });

    return () => unsubAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-px h-16 bg-gradient-to-b from-transparent via-[#c8a97e] to-transparent animate-pulse" />
      </div>
    );
  }

  if (!userData) return null;

  const sub = userData.subscription ?? null;
  const { hasAccess, isTrial, isExclusive, expiresAt } = getAccessState(sub);
  const tier = sub?.tier ?? "free";

  const memberSince = userData.createdAt?.toDate().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  const paidAt = formatDate(sub?.paidAt ?? null);
  const isExpired = sub?.status === "active" && expiresAt != null && expiresAt <= Date.now();
  const isThreshold = sub?.tier === "threshold";

  return (
    <div
      className="min-h-screen bg-[#080808] text-[#e8e0d5]"
      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
    >
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(200,169,126,0.07),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat",
            backgroundSize: "128px",
          }}
        />
      </div>

      <div className="relative max-w-2xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-16">
          <p className="text-xs tracking-[0.3em] text-[#c8a97e]/60 uppercase mb-3">Account</p>
          <h1 className="text-4xl font-light tracking-wide text-[#e8e0d5] mb-1">
            {userData.email.split("@")[0]}
          </h1>
          <p className="text-sm text-[#e8e0d5]/30 tracking-wide">{userData.email}</p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-12">
          <div className="flex-1 h-px bg-gradient-to-r from-[#c8a97e]/40 to-transparent" />
          <div className="w-1 h-1 rounded-full bg-[#c8a97e]/60" />
          <div className="flex-1 h-px bg-gradient-to-l from-[#c8a97e]/40 to-transparent" />
        </div>

        {/* Membership status */}
        <div className="mb-12">
          <p className="text-xs tracking-[0.3em] text-[#c8a97e]/60 uppercase mb-4">Membership</p>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-light tracking-wide">
                {isTrial ? "Standard — Trial" : TIER_LABELS[tier]}
              </p>

              {/* Expiry line */}
              {hasAccess && expiresAt != null && (
                <p className="text-xs text-[#c8a97e]/50 mt-1 tracking-wider">
                  {formatExpiry(expiresAt)}
                </p>
              )}
              {isExpired && (
                <p className="text-xs text-red-400/50 mt-1 tracking-wider">
                  Subscription expired
                </p>
              )}

              {/* Member since */}
              {!isTrial && memberSince && (
                <p className="text-xs text-[#e8e0d5]/30 mt-1 tracking-wider">
                  Member since {memberSince}
                </p>
              )}

              {/* Last paid */}
              {paidAt && (
                <p className="text-xs text-[#e8e0d5]/20 mt-0.5 tracking-wider">
                  Last payment {paidAt}
                </p>
              )}
            </div>

            <span
              className={`text-xs tracking-[0.2em] uppercase px-3 py-1 border shrink-0 ${
                hasAccess
                  ? isTrial
                    ? "border-[#c8a97e]/25 text-[#c8a97e]/70"
                    : "border-[#c8a97e]/40 text-[#c8a97e]"
                  : isExpired
                  ? "border-red-400/20 text-red-400/50"
                  : "border-[#e8e0d5]/10 text-[#e8e0d5]/30"
              }`}
            >
              {hasAccess ? (isTrial ? "Trial" : "Active") : isExpired ? "Expired" : "Inactive"}
            </span>
          </div>
        </div>

        {/* Browse */}
        <div className="mb-12">
          <p className="text-xs tracking-[0.3em] text-[#c8a97e]/60 uppercase mb-6">Browse</p>
          <div className="space-y-2">
            <NavTile
              label="Video Feed"
              description="The full curated library"
              onClick={() => router.push("/videos")}
              available={hasAccess}
            />
            <NavTile
              label="Collections"
              description="Hand-selected thematic series"
              onClick={() => router.push("/collections")}
              available={isExclusive}
              exclusive
            />
            <NavTile
              label="Newest"
              description="First access to everything recent"
              onClick={() => router.push("/videos/new")}
              available={isExclusive}
              exclusive
            />
            <NavTile
              label="Favorites"
              description="Videos you've saved"
              onClick={() => router.push("/favorites")}
              available={hasAccess}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-12">
          <div className="flex-1 h-px bg-[#e8e0d5]/5" />
        </div>

        {/* Subscription CTA */}
        <div className="mb-12">
          <p className="text-xs tracking-[0.3em] text-[#c8a97e]/60 uppercase mb-4">
            {hasAccess && !isTrial && !isThreshold ? "Renewal" : "Access"}
          </p>

          {/* No access or expired */}
          {(!hasAccess || isExpired) && (
            <>
              <p className="text-sm text-[#e8e0d5]/40 mb-5 leading-relaxed">
                {isExpired
                  ? "Your subscription has ended. Renew to restore full access."
                  : "Subscribe to unlock the full collection, favorites, and more."}
              </p>
              <button
                onClick={() => router.push("/subscribe")}
                className="w-full py-3 border border-[#c8a97e]/50 text-[#c8a97e] text-sm tracking-[0.2em] uppercase hover:bg-[#c8a97e]/8 transition-colors duration-300"
              >
                {isExpired ? "Renew Subscription" : "View Subscription Options"}
              </button>
            </>
          )}

          {/* Trial — offer upgrade */}
          {isTrial && (
            <>
              <p className="text-sm text-[#e8e0d5]/40 mb-5 leading-relaxed">
                Upgrade to a full membership for uninterrupted access.
              </p>
              <button
                onClick={() => router.push("/subscribe")}
                className="w-full py-3 border border-[#c8a97e]/30 text-[#c8a97e]/70 text-sm tracking-[0.2em] uppercase hover:border-[#c8a97e]/50 hover:text-[#c8a97e] transition-colors duration-300"
              >
                Upgrade to Full Access
              </button>
            </>
          )}

          {/* Threshold — non-recurring, offer upgrade */}
          {hasAccess && isThreshold && !isTrial && (
            <>
              <p className="text-sm text-[#e8e0d5]/40 mb-5 leading-relaxed">
                Your Threshold access is temporary. Upgrade for ongoing access.
              </p>
              <button
                onClick={() => router.push("/subscribe")}
                className="w-full py-3 border border-[#c8a97e]/30 text-[#c8a97e]/70 text-sm tracking-[0.2em] uppercase hover:border-[#c8a97e]/50 hover:text-[#c8a97e] transition-colors duration-300"
              >
                Upgrade Membership
              </button>
            </>
          )}

          {/* Active Standard or Exclusive — show renewal info */}
          {hasAccess && !isTrial && !isThreshold && !isExpired && (
            <p className="text-sm text-[#e8e0d5]/40 leading-relaxed">
              Your membership renews manually. You will receive an email reminder
              before your access expires. To renew early, you can{" "}
              <button
                onClick={() => router.push("/subscribe")}
                className="text-[#c8a97e]/70 underline underline-offset-2 hover:text-[#c8a97e] transition-colors"
              >
                purchase a new subscription
              </button>{" "}
              at any time.
            </p>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={async () => {
            await auth.signOut();
            router.push("/signin");
          }}
          className="w-full py-3 text-xs tracking-[0.3em] text-[#e8e0d5]/20 uppercase hover:text-[#e8e0d5]/40 transition-colors duration-300"
        >
          Sign Out
        </button>
      </div>

      <Footer />
    </div>
  );
}

interface NavTileProps {
  label: string;
  description: string;
  onClick: () => void;
  available: boolean;
  exclusive?: boolean;
}

function NavTile({ label, description, onClick, available, exclusive }: NavTileProps) {
  return (
    <button
      onClick={available ? onClick : undefined}
      disabled={!available}
      className={`w-full text-left px-5 py-4 border transition-all duration-200 group ${
        available
          ? "border-[#e8e0d5]/10 hover:border-[#c8a97e]/40 hover:bg-[#c8a97e]/4 cursor-pointer"
          : "border-[#e8e0d5]/5 cursor-default opacity-40"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm tracking-wide ${available ? "text-[#e8e0d5]" : "text-[#e8e0d5]/50"}`}>
            {label}
          </p>
          <p className="text-xs text-[#e8e0d5]/30 mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          {exclusive && (
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#c8a97e]/60 border border-[#c8a97e]/20 px-2 py-0.5">
              Exclusive
            </span>
          )}
          {available && (
            <span className="text-[#c8a97e]/40 group-hover:text-[#c8a97e]/80 transition-colors text-lg leading-none">
              →
            </span>
          )}
        </div>
      </div>
    </button>
  );
}