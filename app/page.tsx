"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const pillars = [
  {
    symbol: "✦",
    title: "Purely Synthetic",
    body: "Every image and video is AI-generated. No real faces. No real people. A gallery that exists nowhere else.",
  },
  {
    symbol: "◈",
    title: "Curated, Not Crowdsourced",
    body: "No user uploads, no noise. Every piece is selected for its aesthetic and craft — quality over volume.",
  },
];

const topLinks = [
  { label: "Anime", href: "/videos?tags=anime", image: "/images/anime.jpg" },
  { label: "Realistic", href: "/videos?tags=realistic", image: "/images/realistic.jpg" },
  { label: "Characters", href: "/characters", image: "images/characters.jpg" },
];

const AGE_GATE_KEY = "mystique_age_verified";

export default function Home() {
  const [ageVerified, setAgeVerified] = useState(false);
  const [checkedStorage, setCheckedStorage] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(AGE_GATE_KEY);
    if (stored === "true") {
      setAgeVerified(true);
    }
    setCheckedStorage(true);
  }, []);

  const confirmAge = () => {
    window.localStorage.setItem(AGE_GATE_KEY, "true");
    setAgeVerified(true);
  };

  const declineAge = () => {
    window.location.href = "https://www.google.com";
  };

  return (
    <div
      style={{
        background: "#080808",
        minHeight: "100vh",
        color: "#e8e8e8",
        fontFamily: "'Cormorant Garamond', serif",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <style jsx global>{`
        .categoryTile:hover .categoryTileImg {
          transform: scale(1.08);
          filter: grayscale(0%) brightness(0.95);
        }
        .categoryTile:hover .categoryTileOverlay {
          background: linear-gradient(to top, rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.05) 70%);
        }
        .categoryTile:hover .categoryTileLabel {
          color: #c9a96e;
        }
        @keyframes ageGateFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>

      {/* AGE GATE OVERLAY */}
      {checkedStorage && !ageVerified && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            background: "rgba(5, 5, 5, 0.72)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            animation: "ageGateFadeIn 0.3s ease",
          }}
        >
          <div
            style={{
              maxWidth: 440,
              width: "100%",
              background: "#0e0e0e",
              border: "0.5px solid #262626",
              padding: "3rem 2.5rem",
              textAlign: "center",
              position: "relative",
            }}
          >
            {(["tl", "tr", "bl", "br"] as const).map((c) => (
              <div
                key={c}
                style={{
                  position: "absolute",
                  width: 18,
                  height: 18,
                  ...(c.includes("t") ? { top: 12 } : { bottom: 12 }),
                  ...(c.includes("l") ? { left: 12 } : { right: 12 }),
                  borderTop: c.includes("t") ? "0.5px solid #3a3a3a" : undefined,
                  borderBottom: c.includes("b") ? "0.5px solid #3a3a3a" : undefined,
                  borderLeft: c.includes("l") ? "0.5px solid #3a3a3a" : undefined,
                  borderRight: c.includes("r") ? "0.5px solid #3a3a3a" : undefined,
                }}
              />
            ))}

            <div
              style={{
                fontFamily: "'Josefin Sans', sans-serif",
                fontWeight: 200,
                fontSize: "0.6rem",
                letterSpacing: "0.4em",
                color: "#8a8a8a",
                textTransform: "uppercase",
                marginBottom: "1.5rem",
              }}
            >
              Age Verification Required
            </div>

            <h2
              style={{
                fontWeight: 300,
                fontSize: "1.8rem",
                letterSpacing: "0.04em",
                margin: "0 0 1.25rem",
                color: "#f0f0f0",
              }}
            >
              You must be 18 or older to enter
            </h2>

            <p
              style={{
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: "0.95rem",
                color: "#9a9a9a",
                lineHeight: 1.7,
                margin: "0 0 2.25rem",
              }}
            >
              This site contains AI-generated adult content intended solely for
              viewers of legal age. By entering, you confirm you are at least
              18 years old and consent to viewing this content.
            </p>

            <div style={{ display: "flex", gap: "0.85rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={confirmAge}
                style={{
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontWeight: 300,
                  fontSize: "0.65rem",
                  letterSpacing: "0.35em",
                  textTransform: "uppercase",
                  color: "#080808",
                  background: "#c9a96e",
                  border: "none",
                  cursor: "pointer",
                  padding: "1rem 2.5rem",
                }}
              >
                I am 18 or older
              </button>
              <button
                onClick={declineAge}
                style={{
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontWeight: 300,
                  fontSize: "0.65rem",
                  letterSpacing: "0.35em",
                  textTransform: "uppercase",
                  color: "#9a9a9a",
                  background: "transparent",
                  border: "0.5px solid #333",
                  cursor: "pointer",
                  padding: "1rem 2rem",
                }}
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAGE CONTENT — blurred until age is confirmed */}
      <div
        aria-hidden={!ageVerified}
        style={{
          filter: ageVerified ? "none" : "blur(18px)",
          transition: "filter 0.4s ease",
          pointerEvents: ageVerified ? "auto" : "none",
          userSelect: ageVerified ? "auto" : "none",
        }}
      >
        {/* HERO */}
        <section
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "8rem 2rem 6rem",
            position: "relative",
            textAlign: "center",
          }}
        >
          {/* Corner brackets */}
          {(["tl", "tr", "bl", "br"] as const).map((c) => (
            <div
              key={c}
              style={{
                position: "absolute",
                width: 24,
                height: 24,
                ...(c.includes("t") ? { top: "2rem" } : { bottom: "2rem" }),
                ...(c.includes("l") ? { left: "2rem" } : { right: "2rem" }),
                borderTop: c.includes("t") ? "0.5px solid #1e1e1e" : undefined,
                borderBottom: c.includes("b") ? "0.5px solid #1e1e1e" : undefined,
                borderLeft: c.includes("l") ? "0.5px solid #1e1e1e" : undefined,
                borderRight: c.includes("r") ? "0.5px solid #1e1e1e" : undefined,
              }}
            />
          ))}

          {/* Eyebrow */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "2.5rem",
            }}
          >
            <div style={{ width: 60, height: "0.5px", background: "#1e1e1e" }} />
            <div style={{ width: 5, height: 5, background: "#333", transform: "rotate(45deg)" }} />
            <span
              style={{
                fontFamily: "'Josefin Sans', sans-serif",
                fontWeight: 200,
                fontSize: "0.6rem",
                letterSpacing: "0.45em",
                color: "#6a6a6a",
                textTransform: "uppercase",
              }}
            >
              AI-Generated Adult Gallery
            </span>
            <div style={{ width: 5, height: 5, background: "#333", transform: "rotate(45deg)" }} />
            <div style={{ width: 60, height: "0.5px", background: "#1e1e1e" }} />
          </div>

          {/* Logo */}
          <img
            src="/logo.png"
            alt="MYSTIQUE hAIven"
            style={{
            height: "clamp(48px, 8vw, 72px)",
            width: "auto",
            marginBottom: "1.5rem",
            opacity: 0.92,
            }}
          />

          {/* Title */}
          <h1
            style={{
              fontWeight: 300,
              fontSize: "clamp(2.8rem, 8vw, 5.5rem)",
              letterSpacing: "0.08em",
              margin: "0 0 0.5rem",
              lineHeight: 1.05,
              color: "#e8e8e8",
            }}
          >
            MYSTIQUE{" "}
            <span style={{ fontStyle: "italic", color: "#888", fontSize: "0.88em" }}>
              hAIven
            </span>
          </h1>

          {/* Rule */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              margin: "2rem auto",
            }}
          >
            <div style={{ width: 80, height: "0.5px", background: "#1a1a1a" }} />
            <div
              style={{
                width: 4,
                height: 4,
                background: "#9a7c4a",
                transform: "rotate(45deg)",
              }}
            />
            <div style={{ width: 80, height: "0.5px", background: "#1a1a1a" }} />
          </div>

          {/* Subhead */}
          <p
            style={{
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: "clamp(1rem, 2vw, 1.25rem)",
              color: "#7a7a7a",
              letterSpacing: "0.08em",
              margin: "0 0 3.5rem",
              maxWidth: 520,
            }}
          >
            A sanctuary of synthetic beauty. Entirely AI-crafted. A Collection Like No Other.
          </p>

          {/* CATEGORY SHOWCASE */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(140px, 220px))",
              gap: "1.5rem",
              marginBottom: "3.5rem",
              width: "100%",
              maxWidth: 760,
            }}
          >
            {topLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="categoryTile"
                style={{ textDecoration: "none", display: "block" }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "3 / 4",
                    overflow: "hidden",
                    border: "0.5px solid #1e1e1e",
                  }}
                >
                  <img
                    src={link.image}
                    alt={link.label}
                    className="categoryTileImg"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      filter: "grayscale(35%) brightness(0.75)",
                      transition: "transform 0.4s ease, filter 0.4s ease",
                    }}
                  />
                  <div
                    className="categoryTileOverlay"
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "center",
                      padding: "1.25rem 0",
                      background: "linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.05) 60%)",
                      transition: "background 0.4s ease",
                    }}
                  >
                    <span
                      className="categoryTileLabel"
                      style={{
                        fontFamily: "'Josefin Sans', sans-serif",
                        fontWeight: 300,
                        fontSize: "0.7rem",
                        letterSpacing: "0.3em",
                        textTransform: "uppercase",
                        color: "#ccc",
                        transition: "color 0.4s ease",
                      }}
                    >
                      {link.label}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
            <Link
              href="/signin"
              style={{
                fontFamily: "'Josefin Sans', sans-serif",
                fontWeight: 300,
                fontSize: "0.65rem",
                letterSpacing: "0.4em",
                textTransform: "uppercase",
                color: "#080808",
                background: "#c9a96e",
                textDecoration: "none",
                padding: "1rem 3rem",
                display: "inline-block",
                transition: "background 0.2s, transform 0.15s",
              }}
            >
              Enter the Haven
            </Link>
          </div>

          {/* Scroll hint */}
          <div
            style={{
              position: "absolute",
              bottom: "2.5rem",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <div style={{ width: "0.5px", height: 40, background: "#1a1a1a" }} />
            <span
              style={{
                fontFamily: "'Josefin Sans', sans-serif",
                fontSize: "0.5rem",
                letterSpacing: "0.4em",
                color: "#5a5a5a",
                textTransform: "uppercase",
              }}
            >
              Scroll
            </span>
          </div>
        </section>

        {/* DIVIDER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 4rem",
            gap: "1.5rem",
          }}
        >
          <div style={{ flex: 1, height: "0.5px", background: "#111" }} />
          <div style={{ width: 5, height: 5, background: "#1e1e1e", transform: "rotate(45deg)" }} />
          <div style={{ flex: 1, height: "0.5px", background: "#111" }} />
        </div>

        {/* PILLARS */}
        <section style={{ padding: "7rem 2rem", maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "0",
            }}
          >
            {pillars.map((p, i) => (
              <div
                key={p.title}
                style={{
                  padding: "3rem 2.5rem",
                  borderLeft: i > 0 ? "0.5px solid #111" : undefined,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "1.5rem",
                    color: "#9a7c4a",
                    marginBottom: "1.5rem",
                    lineHeight: 1,
                  }}
                >
                  {p.symbol}
                </div>
                <h3
                  style={{
                    fontWeight: 300,
                    fontSize: "1.15rem",
                    letterSpacing: "0.1em",
                    color: "#ccc",
                    margin: "0 0 1rem",
                    textTransform: "uppercase",
                    fontFamily: "'Josefin Sans', sans-serif",
                  }}
                >
                  {p.title}
                </h3>
                <p
                  style={{
                    fontStyle: "italic",
                    fontWeight: 300,
                    fontSize: "0.95rem",
                    color: "#7a7a7a",
                    lineHeight: 1.7,
                    margin: 0,
                    letterSpacing: "0.03em",
                  }}
                >
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer
          style={{
            borderTop: "0.5px solid #e8e8e8",
            padding: "3rem 3rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1.5rem",
          }}
        >
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
              fontSize: "0.9rem",
              letterSpacing: "0.1em",
              color: "#e8e8e8",
            }}
          >
            MYSTIQUE <span style={{ fontStyle: "italic" }}>hAIven</span>
          </span>
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            {[
              ["Terms", "/terms"],
              ["Privacy", "/privacy"],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                style={{
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontWeight: 200,
                  fontSize: "0.55rem",
                  letterSpacing: "0.3em",
                  color: "#e8e8e8",
                  textDecoration: "none",
                  textTransform: "uppercase",
                  transition: "color 0.2s",
                }}
              >
                {label}
              </Link>
            ))}
          </div>
          <span
            style={{
              fontFamily: "'Josefin Sans', sans-serif",
              fontWeight: 200,
              fontSize: "0.5rem",
              letterSpacing: "0.2em",
              color: "#e8e8e8",
              textTransform: "uppercase",
            }}
          >
            18+ Only · All content is AI-generated synthetic media
          </span>
        </footer>
      </div>
    </div>
  );
}