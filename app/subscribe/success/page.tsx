"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

type SubscriptionStatus = "polling" | "active" | "timeout" | "error";

export default function SubscribeSuccessPage() {
  const [status, setStatus] = useState<SubscriptionStatus>("polling");
  const [tier, setTier] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      router.push("/signin");
      return;
    }

    // Poll timeout — BTCPay webhook can take a moment
    const timeout = setTimeout(() => {
      setStatus((current) => {
        if (current === "polling") return "timeout";
        return current;
      });
    }, 60000); // 60 seconds

    // Listen to Firestore subscription field in real time
    const unsubscribe = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        const data = snap.data();
        const sub = data?.subscription;

        if (sub?.status === "active") {
          setTier(sub.tier);
          setStatus("active");
          clearTimeout(timeout);
        }
      },
      () => {
        setStatus("error");
        clearTimeout(timeout);
      }
    );

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

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
      {/* Ambient glow */}
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

      {/* Top rule */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "3rem",
          width: "100%",
          maxWidth: "480px",
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

      <div style={{ textAlign: "center", maxWidth: "480px", width: "100%" }}>
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
          {status === "polling" && "Confirming Payment"}
          {status === "active" && "Access Granted"}
          {status === "timeout" && "Pending Confirmation"}
          {status === "error" && "Something Went Wrong"}
        </p>

        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(2.8rem, 8vw, 4.5rem)",
            fontWeight: 300,
            color: "#f0e6d3",
            lineHeight: 1.1,
            marginBottom: "1.5rem",
            letterSpacing: "0.02em",
          }}
        >
          {status === "polling" && (
            <>
              The Haven<br />
              <em style={{ color: "#c8a97e" }}>Awaits...</em>
            </>
          )}
          {status === "active" && (
            <>
              Welcome to<br />
              <em style={{ color: "#c8a97e" }}>
                {tier
                  ? tier.charAt(0).toUpperCase() + tier.slice(1)
                  : "The Haven"}
              </em>
            </>
          )}
          {status === "timeout" && (
            <>
              Payment<br />
              <em style={{ color: "#c8a97e" }}>Processing</em>
            </>
          )}
          {status === "error" && (
            <>
              Could Not<br />
              <em style={{ color: "#c8a97e" }}>Confirm</em>
            </>
          )}
        </h1>

        <p
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.15rem",
            color: "#888",
            lineHeight: 1.8,
            marginBottom: "2.5rem",
            fontWeight: 300,
          }}
        >
          {status === "polling" &&
            "Your payment is being verified. This takes just a moment."}
          {status === "active" &&
            "Your subscription is live. The full collection is now open to you."}
          {status === "timeout" &&
            "Bitcoin confirmations can take a few minutes. Your access will activate automatically once confirmed — no need to do anything."}
          {status === "error" &&
            "We could not verify your subscription status. If payment was sent, access will activate shortly. Contact support if this persists."}
        </p>

        {/* Polling indicator */}
        {status === "polling" && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.5rem",
              marginBottom: "2.5rem",
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "#c8a97e",
                  animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        )}

        {/* CTA buttons */}
        {status === "active" && (
          <button
            onClick={() => router.push("/")}
            style={{
              padding: "0.75rem 2rem",
              background: "transparent",
              border: "1px solid #c8a97e55",
              borderRadius: "2px",
              color: "#c8a97e",
              fontFamily: "'Josefin Sans', sans-serif",
              fontSize: "0.55rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              cursor: "pointer",
              marginBottom: "2.5rem",
            }}
          >
            Enter the Haven
          </button>
        )}

        {(status === "timeout" || status === "error") && (
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginBottom: "2.5rem" }}>
            <button
              onClick={() => router.push("/")}
              style={{
                padding: "0.75rem 2rem",
                background: "transparent",
                border: "1px solid #c8a97e55",
                borderRadius: "2px",
                color: "#c8a97e",
                fontFamily: "'Josefin Sans', sans-serif",
                fontSize: "0.55rem",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Return Home
            </button>
            <button
              onClick={() => setStatus("polling")}
              style={{
                padding: "0.75rem 2rem",
                background: "transparent",
                border: "1px solid #c8a97e22",
                borderRadius: "2px",
                color: "#666",
                fontFamily: "'Josefin Sans', sans-serif",
                fontSize: "0.55rem",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Check Again
            </button>
          </div>
        )}
      </div>

      {/* Bottom rule */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          width: "100%",
          maxWidth: "480px",
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

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.4; }
          40% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </main>
  );
}