"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async () => {
    const trimmed = email.trim().toLowerCase();

    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      await setDoc(doc(db, "waitlist", trimmed), {
        email: trimmed,
        joinedAt: new Date(),
      });
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <p style={{ color: "#888", fontSize: "0.85rem", letterSpacing: "0.04em" }}>
        You're on the list.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          style={{
            background: "transparent",
            border: "1px solid #2a2a2a",
            borderRadius: "6px",
            padding: "0.5rem 0.75rem",
            color: "#e8e8e8",
            fontSize: "0.85rem",
            outline: "none",
            width: "220px",
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={status === "loading"}
          style={{
            background: "#e8e8e8",
            color: "#080808",
            border: "none",
            borderRadius: "6px",
            padding: "0.5rem 1.25rem",
            fontSize: "0.85rem",
            fontWeight: 500,
            cursor: status === "loading" ? "not-allowed" : "pointer",
            letterSpacing: "0.04em",
            opacity: status === "loading" ? 0.6 : 1,
          }}
        >
          {status === "loading" ? "..." : "Join the Waitlist"}
        </button>
      </div>
      {errorMsg && (
        <p style={{ color: "#c0392b", fontSize: "0.8rem", margin: 0 }}>{errorMsg}</p>
      )}
    </div>
  );
}