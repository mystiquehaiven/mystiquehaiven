"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User,
} from "firebase/auth";
import { app } from "../../lib/firebase";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "code" | "auth" | "success";
type AuthMode = "signin" | "register";

const ERROR_MESSAGES: Record<string, string> = {
  not_found: "That code doesn't exist. Check for typos and try again.",
  already_redeemed: "This code has already been redeemed.",
  expired: "This code has expired.",
  server_error: "Something went wrong on our end. Please try again shortly.",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function RedeemPage() {
  const router = useRouter();
  const auth = getAuth(app);

  const [step, setStep] = useState<Step>("code");
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Code entry state
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");

  // Auth state
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return unsub;
  }, [auth]);

  // ─── Code submission ────────────────────────────────────────────────────────

  async function handleCodeSubmit() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setCodeError("Enter your redemption code.");
      return;
    }

    // If already signed in, redeem immediately
    if (user) {
      await submitRedemption(trimmed, user);
    } else {
      // Park the code and collect auth
      setCode(trimmed);
      setCodeError("");
      setStep("auth");
    }
  }

  // ─── Redemption API call ────────────────────────────────────────────────────

  async function submitRedemption(codeValue: string, authedUser: User) {
    setLoading(true);
    setCodeError("");

    try {
      const token = await authedUser.getIdToken();
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: codeValue }),
      });

      if (res.ok) {
        setStep("success");
      } else {
        const data = await res.json();
        setCodeError(ERROR_MESSAGES[data.error] ?? ERROR_MESSAGES.server_error);
        setStep("code");
      }
    } catch {
      setCodeError(ERROR_MESSAGES.server_error);
      setStep("code");
    } finally {
      setLoading(false);
    }
  }

  // ─── Auth submission ────────────────────────────────────────────────────────

  async function handleAuthSubmit() {
    setAuthError("");
    setLoading(true);

    try {
      let authedUser: User;

      if (authMode === "signin") {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        authedUser = cred.user;
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        authedUser = cred.user;
      }

      await submitRedemption(code, authedUser);
    } catch (err: any) {
      const msg = friendlyAuthError(err.code);
      setAuthError(msg);
      setLoading(false);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (!authReady) return null;

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <p style={styles.eyebrow}>MystiqueHaiven</p>

        {step === "code" && (
          <>
            <h1 style={styles.heading}>Redeem your code</h1>
            <p style={styles.body}>
              Enter the code from your order confirmation email to activate your
              platform access.
            </p>

            <label style={styles.label}>Redemption code</label>
            <input
              style={styles.input}
              type="text"
              placeholder="MHVN-XXXX-XXXX-XXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleCodeSubmit()}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="characters"
            />

            {codeError && <p style={styles.error}>{codeError}</p>}

            <button
              style={{ ...styles.button, opacity: loading ? 0.5 : 1 }}
              onClick={handleCodeSubmit}
              disabled={loading}
            >
              {loading ? "Activating…" : "Continue"}
            </button>
          </>
        )}

        {step === "auth" && (
          <>
            <h1 style={styles.heading}>
              {authMode === "signin" ? "Sign in to continue" : "Create an account"}
            </h1>
            <p style={styles.body}>
              {authMode === "signin"
                ? "Sign in to link your code to your existing account."
                : "Create an account to activate your access."}
            </p>

            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <label style={{ ...styles.label, marginTop: 16 }}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder={authMode === "register" ? "Create a password" : "Your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAuthSubmit()}
              autoComplete={authMode === "signin" ? "current-password" : "new-password"}
            />

            {authError && <p style={styles.error}>{authError}</p>}

            <button
              style={{ ...styles.button, opacity: loading ? 0.5 : 1 }}
              onClick={handleAuthSubmit}
              disabled={loading}
            >
              {loading
                ? "Activating…"
                : authMode === "signin"
                ? "Sign in and activate"
                : "Create account and activate"}
            </button>

            <button
              style={styles.switchMode}
              onClick={() => {
                setAuthMode(authMode === "signin" ? "register" : "signin");
                setAuthError("");
              }}
            >
              {authMode === "signin"
                ? "No account? Create one"
                : "Already have an account? Sign in"}
            </button>

            <button
              style={styles.back}
              onClick={() => { setStep("code"); setAuthError(""); }}
            >
              ← Back
            </button>
          </>
        )}

        {step === "success" && (
          <>
            <h1 style={styles.heading}>Access activated</h1>
            <p style={styles.body}>
              Your account now includes one year of Standard access and a 60-day
              Exclusive trial. Enjoy.
            </p>
            <button
              style={styles.button}
              onClick={() => router.push("/")}
            >
              Go to MystiqueHaiven
            </button>
          </>
        )}
      </div>
    </main>
  );
}

// ─── Auth error mapping ───────────────────────────────────────────────────────

function friendlyAuthError(code: string): string {
  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/email-already-in-use":
      return "An account with that email already exists. Sign in instead.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again in a few minutes.";
    default:
      return "Something went wrong. Please try again.";
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0d0d0d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  card: {
    width: "100%",
    maxWidth: 480,
    background: "#111",
    border: "1px solid #2a2a2a",
    borderRadius: 4,
    padding: "48px 40px",
  },
  eyebrow: {
    margin: "0 0 24px",
    fontSize: 11,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#c8a97e",
    fontFamily: "'Josefin Sans', sans-serif",
  },
  heading: {
    margin: "0 0 12px",
    fontSize: 28,
    fontWeight: 400,
    color: "#e8d8c0",
    lineHeight: 1.2,
  },
  body: {
    margin: "0 0 32px",
    fontSize: 15,
    lineHeight: 1.75,
    color: "#807060",
  },
  label: {
    display: "block",
    marginBottom: 8,
    fontSize: 11,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#666",
    fontFamily: "'Josefin Sans', sans-serif",
  },
  input: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 3,
    fontSize: 16,
    letterSpacing: "0.06em",
    color: "#e8d8c0",
    outline: "none",
    fontFamily: "'Courier New', monospace",
    marginBottom: 8,
  },
  error: {
    margin: "0 0 16px",
    fontSize: 13,
    color: "#c0614a",
    lineHeight: 1.5,
  },
  button: {
    display: "block",
    width: "100%",
    marginTop: 24,
    padding: "14px",
    background: "transparent",
    border: "1px solid #c8a97e",
    borderRadius: 3,
    fontSize: 13,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#c8a97e",
    cursor: "pointer",
    fontFamily: "'Josefin Sans', sans-serif",
    transition: "background 0.15s, color 0.15s",
  },
  switchMode: {
    display: "block",
    width: "100%",
    marginTop: 12,
    padding: "10px",
    background: "transparent",
    border: "none",
    fontSize: 13,
    color: "#666",
    cursor: "pointer",
    fontFamily: "'Josefin Sans', sans-serif",
    letterSpacing: "0.04em",
  },
  back: {
    display: "block",
    marginTop: 8,
    padding: "8px 0",
    background: "transparent",
    border: "none",
    fontSize: 13,
    color: "#4a4030",
    cursor: "pointer",
    fontFamily: "'Josefin Sans', sans-serif",
    letterSpacing: "0.04em",
  },
};