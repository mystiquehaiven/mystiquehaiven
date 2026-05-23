"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";

const TIERS = [
  {
    id: "threshold",
    label: "Threshold",
    price: "$0.99",
    duration: "2 days",
    description: "A brief passage into the Haven. Non-recurring.",
    features: ["Full content access", "2-day window", "One-time purchase"],
  },
  {
    id: "standard",
    label: "Standard",
    price: "$14.99",
    duration: "per month",
    description: "Unrestricted access to the full collection.",
    features: ["Full content access", "Tag & sort filters", "Monthly renewal"],
  },
  {
    id: "exclusive",
    label: "Exclusive",
    price: "$19.99",
    duration: "per month",
    description: "The deepest access. Curated collections and new content feed.",
    features: [
      "Everything in Standard",
      "Curated collections",
      "New content feed",
      "Monthly renewal",
    ],
  },
];

export default function SubscribePage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubscribe(tierId: string) {
    setError(null);
    setLoading(tierId);

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        router.push("/signin");
        return;
      }

      const token = await user.getIdToken();

      const res = await fetch("/api/btcpay/create-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier: tierId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      // Redirect to BTCPay hosted checkout
      window.location.href = data.invoiceUrl;
    } catch (err) {
      setError("Failed to initiate checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient background glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at center, rgba(200,169,126,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Decorative top rule */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "3rem",
          width: "100%",
          maxWidth: "900px",
        }}
      >
        <div style={{ flex: 1, height: "1px", backgroundColor: "#c8a97e33" }} />
        <span
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            fontSize: "0.5rem",
            letterSpacing: "0.35em",
            color: "#c8a97e66",
          }}
        >
          ✦
        </span>
        <div style={{ flex: 1, height: "1px", backgroundColor: "#c8a97e33" }} />
      </div>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <p
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            fontSize: "0.6rem",
            letterSpacing: "0.4em",
            color: "#c8a97e",
            textTransform: "uppercase",
            marginBottom: "1.5rem",
          }}
        >
          Membership
        </p>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(2.8rem, 8vw, 4.5rem)",
            fontWeight: 300,
            color: "#f0e6d3",
            lineHeight: 1.1,
            marginBottom: "1rem",
            letterSpacing: "0.02em",
          }}
        >
          Choose Your <em style={{ color: "#c8a97e" }}>Access</em>
        </h1>
        <p
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.15rem",
            color: "#888",
            fontWeight: 300,
          }}
        >
          Paid via Bitcoin. No card required.
        </p>
      </div>

      {/* Tier cards */}
      <div
        style={{
          display: "flex",
          gap: "1.5rem",
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: "900px",
          width: "100%",
          marginBottom: "3rem",
        }}
      >
        {TIERS.map((tier) => (
          <div
            key={tier.id}
            style={{
              flex: "1 1 240px",
              maxWidth: "280px",
              border: `1px solid ${tier.id === "exclusive" ? "#c8a97e55" : "#c8a97e22"}`,
              borderRadius: "4px",
              padding: "2rem 1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              background:
                tier.id === "exclusive"
                  ? "rgba(200,169,126,0.04)"
                  : "transparent",
              position: "relative",
            }}
          >
            {tier.id === "exclusive" && (
              <div
                style={{
                  position: "absolute",
                  top: "-1px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#0a0a0a",
                  padding: "0 0.75rem",
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontSize: "0.5rem",
                  letterSpacing: "0.3em",
                  color: "#c8a97e",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                Most Access
              </div>
            )}

            <div>
              <p
                style={{
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontSize: "0.55rem",
                  letterSpacing: "0.3em",
                  color: "#c8a97e",
                  textTransform: "uppercase",
                  marginBottom: "0.5rem",
                }}
              >
                {tier.label}
              </p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                <span
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "2.5rem",
                    fontWeight: 300,
                    color: "#f0e6d3",
                  }}
                >
                  {tier.price}
                </span>
                <span
                  style={{
                    fontFamily: "'Josefin Sans', sans-serif",
                    fontSize: "0.5rem",
                    letterSpacing: "0.2em",
                    color: "#666",
                    textTransform: "uppercase",
                  }}
                >
                  {tier.duration}
                </span>
              </div>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "0.95rem",
                  color: "#666",
                  marginTop: "0.5rem",
                  lineHeight: 1.6,
                }}
              >
                {tier.description}
              </p>
            </div>

            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {tier.features.map((f) => (
                <li
                  key={f}
                  style={{
                    fontFamily: "'Josefin Sans', sans-serif",
                    fontSize: "0.55rem",
                    letterSpacing: "0.15em",
                    color: "#888",
                    textTransform: "uppercase",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span style={{ color: "#c8a97e44" }}>—</span> {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(tier.id)}
              disabled={!!loading}
              style={{
                marginTop: "auto",
                padding: "0.75rem 1rem",
                background: loading === tier.id ? "#c8a97e22" : "transparent",
                border: "1px solid #c8a97e55",
                borderRadius: "2px",
                color: "#c8a97e",
                fontFamily: "'Josefin Sans', sans-serif",
                fontSize: "0.55rem",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!loading)
                  (e.target as HTMLButtonElement).style.background = "#c8a97e11";
              }}
              onMouseLeave={(e) => {
                if (!loading)
                  (e.target as HTMLButtonElement).style.background = "transparent";
              }}
            >
              {loading === tier.id ? "Preparing..." : "Begin"}
            </button>
          </div>
        ))}
      </div>

      {error && (
        <p
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            fontSize: "0.55rem",
            letterSpacing: "0.2em",
            color: "#c84e4e",
            textTransform: "uppercase",
            marginBottom: "2rem",
          }}
        >
          {error}
        </p>
      )}

      {/* Decorative bottom rule */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          width: "100%",
          maxWidth: "900px",
        }}
      >
        <div style={{ flex: 1, height: "1px", backgroundColor: "#c8a97e33" }} />
        <span
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            fontSize: "0.5rem",
            letterSpacing: "0.35em",
            color: "#c8a97e66",
          }}
        >
          ✦
        </span>
        <div style={{ flex: 1, height: "1px", backgroundColor: "#c8a97e33" }} />
      </div>
    </main>
  );
}