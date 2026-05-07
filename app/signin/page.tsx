"use client";

import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { fetchTermsContent, getTermsVersionAction } from "@/app/actions/terms";
import Link from "next/link";

type ModalState = "idle" | "age-verify" | "tos" | "denied";

/* ─── Shared style tokens ─── */
const font = {
  display: "'Cormorant Garamond', serif",
  sans: "'Josefin Sans', sans-serif",
};
const color = {
  bg: "#080808",
  surface: "#0d0d0d",
  border: "#1a1a1a",
  borderMid: "#222",
  gold: "#c9a96e",
  goldDim: "#9a7c4a",
  text: "#e8e8e8",
  textMid: "#888",
  textDim: "#444",
  textGhost: "#2a2a2a",
};

/* ─── Reusable modal shell ─── */
function ModalShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          background: color.surface,
          border: `0.5px solid ${color.borderMid}`,
          padding: wide ? "3rem" : "3rem 2.5rem",
          width: "100%",
          maxWidth: wide ? 680 : 420,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Corner brackets */}
        {(["tl", "tr", "bl", "br"] as const).map((c) => (
          <div
            key={c}
            style={{
              position: "absolute",
              width: 16,
              height: 16,
              ...(c.includes("t") ? { top: -1 } : { bottom: -1 }),
              ...(c.includes("l") ? { left: -1 } : { right: -1 }),
              borderTop: c.includes("t") ? `1px solid ${color.gold}` : undefined,
              borderBottom: c.includes("b") ? `1px solid ${color.gold}` : undefined,
              borderLeft: c.includes("l") ? `1px solid ${color.gold}` : undefined,
              borderRight: c.includes("r") ? `1px solid ${color.gold}` : undefined,
              opacity: 0.5,
            }}
          />
        ))}
        {children}
      </div>
    </div>
  );
}

function ModalEyebrow({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        marginBottom: "1.75rem",
      }}
    >
      <div style={{ flex: 1, height: "0.5px", background: color.border }} />
      <span
        style={{
          fontFamily: font.sans,
          fontWeight: 200,
          fontSize: "0.55rem",
          letterSpacing: "0.4em",
          color: color.textGhost,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: "0.5px", background: color.border }} />
    </div>
  );
}

function GoldButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        fontFamily: font.sans,
        fontWeight: 300,
        fontSize: "0.6rem",
        letterSpacing: "0.35em",
        textTransform: "uppercase",
        color: disabled ? color.textGhost : color.bg,
        background: disabled ? "#1a1a1a" : hovered ? "#b8954e" : color.gold,
        border: "none",
        padding: "0.9rem 1.5rem",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.2s, color 0.2s",
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        fontFamily: font.sans,
        fontWeight: 200,
        fontSize: "0.6rem",
        letterSpacing: "0.35em",
        textTransform: "uppercase",
        color: hovered ? color.textMid : color.textDim,
        background: "transparent",
        border: `0.5px solid ${hovered ? "#333" : color.border}`,
        padding: "0.9rem 1.5rem",
        cursor: "pointer",
        transition: "color 0.2s, border-color 0.2s",
      }}
    >
      {children}
    </button>
  );
}

export default function SignInPage() {
  const router = useRouter();
  const [modalState, setModalState] = useState<ModalState>("idle");
  const [pendingUser, setPendingUser] = useState<{
    uid: string;
    email: string | null;
  } | null>(null);
  const [termsHtml, setTermsHtml] = useState("");
  const [tosAccepted, setTosAccepted] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (modalState === "tos") {
      fetchTermsContent().then(setTermsHtml);
    }
  }, [modalState]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setPendingUser({ uid: user.uid, email: user.email });
        setModalState("age-verify");
        return;
      }

      const userTosVersion = userSnap.data()?.tosVersion;
      const currentVersion = await getTermsVersionAction();

      if (userTosVersion !== currentVersion) {
        setPendingUser({ uid: user.uid, email: user.email });
        setModalState("tos");
        return;
      }

      await routeUser(user);
    } catch (error) {
      console.error(error);
    } finally {
      setSigningIn(false);
    }
  };

  const handleAgeConfirmed = () => {
    setTosAccepted(false);
    setModalState("tos");
  };

  const handleAgeDenied = () => {
    setPendingUser(null);
    setTosAccepted(false);
    setModalState("denied");
  };

  const handleTosAccepted = async () => {
    if (!pendingUser) return;
    try {
      const currentVersion = await getTermsVersionAction();
      const isNewUser = !(await getDoc(doc(db, "users", pendingUser.uid))).exists;

await setDoc(
  doc(db, "users", pendingUser.uid),
  {
    email: pendingUser.email,
    ageVerified: true,
    ageVerifiedAt: new Date(),
    tosAcceptedAt: new Date(),
    tosVersion: currentVersion,
    ...(isNewUser ? {
      subscription: {
        tier: "free",
        status: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        trialExpiresAt: null,
        updatedAt: null,
      },
      createdAt: new Date(),
    } : {}),
  },
  { merge: true }
);

      setModalState("idle");
      setTosAccepted(false);

      const user = auth.currentUser;
      if (user) await routeUser(user);
    } catch (error) {
      console.error(error);
    }
  };

  const handleTosDenied = () => {
    setPendingUser(null);
    setTosAccepted(false);
    setModalState("denied");
  };

  const routeUser = async (user: { getIdTokenResult: () => Promise<any> }) => {
    const tokenResult = await user.getIdTokenResult();
    if (tokenResult.claims.admin) {
      router.push("/admin");
    } else {
      router.push("/profile");
    }
  };

  return (
    <div
      style={{
        background: color.bg,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: font.display,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Architectural background lines */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* Outer frame */}
        <div
          style={{
            position: "absolute",
            inset: "2rem",
            border: `0.5px solid #0f0f0f`,
          }}
        />
        {/* Inner frame */}
        <div
          style={{
            position: "absolute",
            inset: "3.5rem",
            border: `0.5px solid #0d0d0d`,
          }}
        />
        {/* Vertical center line */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: "0.5px",
            background: "#0d0d0d",
          }}
        />
        {/* Horizontal center line */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: "0.5px",
            background: "#0d0d0d",
          }}
        />
      </div>

      {/* Nav 
      <nav
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1.5rem 3rem",
          borderBottom: `0.5px solid ${color.border}`,
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: font.display,
            fontWeight: 300,
            fontSize: "1rem",
            letterSpacing: "0.12em",
            color: color.textMid,
            textDecoration: "none",
            transition: "color 0.2s",
          }}
        >
          MYSTIQUE <span style={{ fontStyle: "italic", color: color.textDim, fontSize: "0.9em" }}>hAIven</span>
        </Link>
        <Link
          href="/signup"
          style={{
            fontFamily: font.sans,
            fontWeight: 200,
            fontSize: "0.55rem",
            letterSpacing: "0.35em",
            color: color.textDim,
            textDecoration: "none",
            textTransform: "uppercase",
          }}
        >
          No account? Join →
        </Link>
      </nav>
      */}

      {/* Main content — centered */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 10,
          padding: "4rem 2rem",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            maxWidth: 380,
            width: "100%",
          }}
        >
          {/* Eyebrow ornament */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.875rem",
              marginBottom: "2.5rem",
            }}
          >
            <div style={{ width: 48, height: "0.5px", background: color.border }} />
            <div
              style={{
                width: 5,
                height: 5,
                background: color.goldDim,
                transform: "rotate(45deg)",
              }}
            />
            <span
              style={{
                fontFamily: font.sans,
                fontWeight: 200,
                fontSize: "0.55rem",
                letterSpacing: "0.45em",
                color: color.textGhost,
                textTransform: "uppercase",
              }}
            >
              Return to the Haven
            </span>
            <div
              style={{
                width: 5,
                height: 5,
                background: color.goldDim,
                transform: "rotate(45deg)",
              }}
            />
            <div style={{ width: 48, height: "0.5px", background: color.border }} />
          </div>

          {/* Title */}
          <h1
            style={{
              fontWeight: 300,
              fontSize: "2.6rem",
              letterSpacing: "0.08em",
              color: color.text,
              margin: "0 0 0.5rem",
              textAlign: "center",
              lineHeight: 1.1,
            }}
          >
            Welcome Back
          </h1>
          <p
            style={{
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: "0.9rem",
              color: color.textDim,
              letterSpacing: "0.05em",
              margin: "0 0 3rem",
              textAlign: "center",
            }}
          >
            Sign in to access your collection
          </p>

          {/* Sign-in button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
              background: "transparent",
              border: `0.5px solid ${color.borderMid}`,
              padding: "1.1rem 2rem",
              cursor: signingIn ? "wait" : "pointer",
              transition: "border-color 0.2s, background 0.2s",
              position: "relative",
              marginBottom: "1rem",
            }}
            onMouseEnter={(e) => {
              if (!signingIn) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = color.goldDim;
                (e.currentTarget as HTMLButtonElement).style.background = "#0f0f0f";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = color.borderMid;
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            {/* Google icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span
              style={{
                fontFamily: font.sans,
                fontWeight: 300,
                fontSize: "0.65rem",
                letterSpacing: "0.35em",
                color: signingIn ? color.textDim : color.textMid,
                textTransform: "uppercase",
              }}
            >
              {signingIn ? "Entering..." : "Continue with Google"}
            </span>
          </button>

          {/* Divider */}
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              margin: "1.5rem 0",
            }}
          >
            <div style={{ flex: 1, height: "0.5px", background: color.border }} />
            <span
              style={{
                fontFamily: font.sans,
                fontSize: "0.5rem",
                letterSpacing: "0.3em",
                color: color.textGhost,
                textTransform: "uppercase",
              }}
            >
              Or
            </span>
            <div style={{ flex: 1, height: "0.5px", background: color.border }} />
          </div>

          {/* More providers placeholder */}
          <p
            style={{
              fontFamily: font.sans,
              fontWeight: 200,
              fontSize: "0.55rem",
              letterSpacing: "0.25em",
              color: color.textGhost,
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            More sign-in options coming soon
          </p>

          {/* Bottom ornament */}
          <div
            style={{
              marginTop: "3.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <div style={{ width: 32, height: "0.5px", background: color.border }} />
            <span style={{ color: color.textGhost, fontSize: "0.6rem" }}>✦</span>
            <div style={{ width: 32, height: "0.5px", background: color.border }} />
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          textAlign: "center",
          padding: "1.5rem 2rem",
          borderTop: `0.5px solid ${color.border}`,
        }}
      >
        <span
          style={{
            fontFamily: font.sans,
            fontWeight: 200,
            fontSize: "0.5rem",
            letterSpacing: "0.2em",
            color: color.textGhost,
            textTransform: "uppercase",
          }}
        >
          18+ Only · All content is AI-generated synthetic media
        </span>
      </div>

      {/* ── Age Verification Modal ── */}
      {modalState === "age-verify" && (
        <ModalShell>
          <ModalEyebrow label="Age Verification" />
          <h2
            style={{
              fontWeight: 300,
              fontSize: "1.8rem",
              letterSpacing: "0.06em",
              color: color.text,
              margin: "0 0 1rem",
            }}
          >
            Confirm Your Age
          </h2>
          <p
            style={{
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: "0.9rem",
              color: color.textDim,
              lineHeight: 1.7,
              letterSpacing: "0.03em",
              margin: "0 0 2.5rem",
            }}
          >
            This platform contains mature content intended for adults only. You must be 18 years of age or older to enter.
          </p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <GoldButton onClick={handleAgeConfirmed}>I am 18 or older</GoldButton>
            <GhostButton onClick={handleAgeDenied}>I am under 18</GhostButton>
          </div>
        </ModalShell>
      )}

      {/* ── Terms of Service Modal ── */}
      {modalState === "tos" && (
        <ModalShell wide>
          <ModalEyebrow label="Terms of Service" />
          <h2
            style={{
              fontWeight: 300,
              fontSize: "1.8rem",
              letterSpacing: "0.06em",
              color: color.text,
              margin: "0 0 1.5rem",
              flexShrink: 0,
            }}
          >
            Review & Accept
          </h2>

          {/* Scrollable terms */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              border: `0.5px solid ${color.border}`,
              padding: "1.5rem",
              marginBottom: "1.5rem",
              minHeight: 0,
            }}
          >
            {termsHtml ? (
              <div
                dangerouslySetInnerHTML={{ __html: termsHtml }}
                style={{
                  fontFamily: font.sans,
                  fontWeight: 300,
                  fontSize: "0.75rem",
                  lineHeight: 1.8,
                  letterSpacing: "0.02em",
                  color: color.textDim,
                }}
              />
            ) : (
              <p
                style={{
                  fontStyle: "italic",
                  color: color.textGhost,
                  fontSize: "0.85rem",
                  textAlign: "center",
                  padding: "2rem 0",
                }}
              >
                Loading terms...
              </p>
            )}
          </div>

          {/* Checkbox */}
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.875rem",
              cursor: "pointer",
              marginBottom: "1.5rem",
              flexShrink: 0,
            }}
          >
            <div
              onClick={() => setTosAccepted(!tosAccepted)}
              style={{
                width: 16,
                height: 16,
                border: `0.5px solid ${tosAccepted ? color.goldDim : color.borderMid}`,
                background: tosAccepted ? color.goldDim : "transparent",
                flexShrink: 0,
                marginTop: 2,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "border-color 0.2s, background 0.2s",
              }}
            >
              {tosAccepted && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L4 7L9 1" stroke={color.bg} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span
              style={{
                fontFamily: font.sans,
                fontWeight: 300,
                fontSize: "0.65rem",
                letterSpacing: "0.05em",
                color: color.textDim,
                lineHeight: 1.6,
              }}
            >
              I have read and agree to the Terms of Service
            </span>
          </label>

          <div style={{ display: "flex", gap: "0.75rem", flexShrink: 0 }}>
            <GoldButton onClick={handleTosAccepted} disabled={!tosAccepted}>
              Accept & Enter
            </GoldButton>
            <GhostButton onClick={handleTosDenied}>Decline</GhostButton>
          </div>
        </ModalShell>
      )}

      {/* ── Access Denied Modal ── */}
      {modalState === "denied" && (
        <ModalShell>
          <ModalEyebrow label="Access Restricted" />
          <h2
            style={{
              fontWeight: 300,
              fontSize: "1.8rem",
              letterSpacing: "0.06em",
              color: color.text,
              margin: "0 0 1rem",
            }}
          >
            Entry Denied
          </h2>
          <p
            style={{
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: "0.9rem",
              color: color.textDim,
              lineHeight: 1.7,
              letterSpacing: "0.03em",
              margin: "0 0 2.5rem",
            }}
          >
            You must be 18 years of age or older to access this platform. Please close this window.
          </p>
          <div style={{ height: "0.5px", background: color.border }} />
        </ModalShell>
      )}
    </div>
  );
}