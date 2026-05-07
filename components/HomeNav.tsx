// components/HomeNav.tsx
"use client";

import Link from "next/link";

export default function HomeNav() {
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1.25rem 3rem",
        borderBottom: "0.5px solid #1a1a1a",
        background: "rgba(8,8,8,0.92)",
        backdropFilter: "blur(12px)",
      }}
    >
      <span
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontWeight: 300,
          fontSize: "1.1rem",
          letterSpacing: "0.12em",
          color: "#e8e8e8",
        }}
      >
        MYSTIQUE <span style={{ fontStyle: "italic", color: "#666", fontSize: "1rem" }}>hAIven</span>
      </span>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <Link
          href="/signin"
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            fontWeight: 300,
            fontSize: "0.6rem",
            letterSpacing: "0.3em",
            color: "#666",
            textDecoration: "none",
            textTransform: "uppercase",
            padding: "0.5rem 1.25rem",
            border: "0.5px solid #222",
            transition: "color 0.2s, border-color 0.2s",
          }}
          onMouseEnter={e => {
            (e.target as HTMLAnchorElement).style.color = "#e8e8e8";
            (e.target as HTMLAnchorElement).style.borderColor = "#444";
          }}
          onMouseLeave={e => {
            (e.target as HTMLAnchorElement).style.color = "#666";
            (e.target as HTMLAnchorElement).style.borderColor = "#222";
          }}
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            fontWeight: 300,
            fontSize: "0.6rem",
            letterSpacing: "0.3em",
            color: "#080808",
            textDecoration: "none",
            textTransform: "uppercase",
            padding: "0.5rem 1.25rem",
            background: "#c9a96e",
            transition: "background 0.2s",
          }}
          onMouseEnter={e => {
            (e.target as HTMLAnchorElement).style.background = "#b8954e";
          }}
          onMouseLeave={e => {
            (e.target as HTMLAnchorElement).style.background = "#c9a96e";
          }}
        >
          Join
        </Link>
      </div>
    </nav>
  );
}