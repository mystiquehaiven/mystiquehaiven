"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

const NEW_CONTENT_COUNT = 20;

type SubscriptionTier = "none" | "threshold" | "standard" | "exclusive";

interface UserData {
  email: string;
  subscriptionStatus: string;
  subscriptionTier: SubscriptionTier;
  ageVerified: boolean;
  createdAt: { toDate: () => Date };
}

const TIER_LABELS: Record<SubscriptionTier, string> = {
  none: "No Subscription",
  threshold: "Threshold",
  standard: "Standard",
  exclusive: "Exclusive",
};

const isActive = (data: UserData) =>
  data.subscriptionStatus === "active" &&
  data.subscriptionTier !== "none";

export default function ProfilePage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/signin");
        return;
      }
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) setUserData(snap.data() as UserData);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-px h-16 bg-gradient-to-b from-transparent via-[#c8a97e] to-transparent animate-pulse" />
      </div>
    );
  }

  if (!userData) return null;

  const subscribed = isActive(userData);
  const tier = userData.subscriptionTier;
  const hasExclusive = tier === "exclusive";
  const memberSince = userData.createdAt?.toDate().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-[#080808] text-[#e8e0d5]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(200,169,126,0.07),transparent)]" />
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")", backgroundRepeat: "repeat", backgroundSize: "128px" }} />
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

        {/* Subscription status */}
        <div className="mb-12">
          <p className="text-xs tracking-[0.3em] text-[#c8a97e]/60 uppercase mb-4">Membership</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-light tracking-wide">
                {TIER_LABELS[tier]}
              </p>
              {memberSince && (
                <p className="text-xs text-[#e8e0d5]/30 mt-1 tracking-wider">Member since {memberSince}</p>
              )}
            </div>
            <span className={`text-xs tracking-[0.2em] uppercase px-3 py-1 border ${
              subscribed
                ? "border-[#c8a97e]/40 text-[#c8a97e]"
                : "border-[#e8e0d5]/10 text-[#e8e0d5]/30"
            }`}>
              {subscribed ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {/* Content access */}
        <div className="mb-12">
          <p className="text-xs tracking-[0.3em] text-[#c8a97e]/60 uppercase mb-6">Browse</p>
          <div className="space-y-2">

            {/* Always available */}
            <NavTile
              label="Free Preview"
              description="A rotating selection, refreshed every 24 hours"
              onClick={() => router.push("/feed/preview")}
              available
            />

            {/* Standard + above */}
            <NavTile
              label="General Collection"
              description="The full curated library"
              onClick={() => router.push("/videos")}
              available={subscribed}
            />

            {/* Exclusive only */}
            <NavTile
              label="Curated Collections"
              description="Hand-selected thematic series"
              onClick={() => router.push("/feed/curated")}
              available={hasExclusive}
              exclusive
            />

            <NavTile
              label={`New — Last ${NEW_CONTENT_COUNT} Uploads`}
              description="First access to everything recent"
              onClick={() => router.push("/feed/new")}
              available={hasExclusive}
              exclusive
            />

            {/* Favorites — subscribed only */}
            <NavTile
              label="Favorites"
              description="Videos you've saved"
              onClick={() => router.push("/favorites")}
              available={subscribed}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-12">
          <div className="flex-1 h-px bg-[#e8e0d5]/5" />
        </div>

        {/* CTA or Manage */}
        {!subscribed ? (
          <div className="mb-12">
            <p className="text-xs tracking-[0.3em] text-[#c8a97e]/60 uppercase mb-4">Access</p>
            <p className="text-sm text-[#e8e0d5]/40 mb-5 leading-relaxed">
              Subscribe to unlock the full collection, favorites, and more.
            </p>
            <button
              onClick={() => router.push("/subscribe")}
              className="w-full py-3 border border-[#c8a97e]/50 text-[#c8a97e] text-sm tracking-[0.2em] uppercase hover:bg-[#c8a97e]/8 transition-colors duration-300"
            >
              View Subscription Options
            </button>
          </div>
        ) : (
          <div className="mb-12">
            <p className="text-xs tracking-[0.3em] text-[#c8a97e]/60 uppercase mb-4">Subscription</p>
            <button
              onClick={() => {
                // TODO: redirect to Stripe customer portal URL
                console.warn("Stripe portal not yet configured");
              }}
              className="w-full py-3 border border-[#e8e0d5]/10 text-[#e8e0d5]/40 text-sm tracking-[0.2em] uppercase hover:border-[#e8e0d5]/20 hover:text-[#e8e0d5]/60 transition-colors duration-300"
            >
              Manage Subscription
            </button>
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={async () => { await auth.signOut(); router.push("/signin"); }}
          className="w-full py-3 text-xs tracking-[0.3em] text-[#e8e0d5]/20 uppercase hover:text-[#e8e0d5]/40 transition-colors duration-300"
        >
          Sign Out
        </button>

      </div>
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
            <span className="text-[#c8a97e]/40 group-hover:text-[#c8a97e]/80 transition-colors text-lg leading-none">→</span>
          )}
        </div>
      </div>
    </button>
  );
}