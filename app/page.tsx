import HomeNav from "../components/HomeNav";
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
  {
    symbol: "⬡",
    title: "Tiered Access",
    body: "From the standard to the exclusive inner sanctum. Deeper access unlocks richer, more experimental content.",
  },
];

const tiers = [
  {
    name: "Two Day One-Off",
    price: "$0.99",
    oneOff: true,
    description: "Temporary Entry into the haven",
    features: ["Standard gallery access"],
    accent: "#2a2a2a",
    textAccent: "#888",
  },
  {
    name: "Standard",
    price: "$14.99",
    oneOff: false,
    description: "The full experience",
    features: ["Standard gallery access"],
    accent: "#9a7c4a",
    textAccent: "#c9a96e",
    featured: true,
  },
  {
    name: "Exclusive",
    oneOff: false,
    price: "$19.99",
    description: "The inner sanctum",
    features: ["Everything in Standard", "Exclusive New Content", "Access to Collections not availalble in Standard"],
    accent: "#2a2a2a",
    textAccent: "#888",
  },
];

export default function Home() {
  return (
    <div
      style={{
        background: "#080808",
        minHeight: "100vh",
        color: "#e8e8e8",
        fontFamily: "'Cormorant Garamond', serif",
        overflowX: "hidden",
      }}
    >
      {/* NAV */}
      <HomeNav />

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
              color: "#3a3a3a",
              textTransform: "uppercase",
            }}
          >
            AI-Generated Adult Gallery
          </span>
          <div style={{ width: 5, height: 5, background: "#333", transform: "rotate(45deg)" }} />
          <div style={{ width: 60, height: "0.5px", background: "#1e1e1e" }} />
        </div>

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
          <span style={{ fontStyle: "italic", color: "#555", fontSize: "0.88em" }}>
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
            color: "#444",
            letterSpacing: "0.08em",
            margin: "0 0 3.5rem",
            maxWidth: 520,
          }}
        >
          A sanctuary of synthetic beauty. Entirely AI-crafted. A Collection Like No Other.
        </p>

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
          <Link
            href="/signin"
            style={{
              fontFamily: "'Josefin Sans', sans-serif",
              fontWeight: 300,
              fontSize: "0.65rem",
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: "#555",
              background: "transparent",
              textDecoration: "none",
              padding: "1rem 3rem",
              display: "inline-block",
              border: "0.5px solid #222",
              transition: "color 0.2s, border-color 0.2s",
            }}
          >
            Sign In
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
              color: "#2a2a2a",
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
                  color: "#444",
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
        <span
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            fontWeight: 200,
            fontSize: "0.55rem",
            letterSpacing: "0.45em",
            color: "#2a2a2a",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          Choose Your Tier
        </span>
        <div style={{ flex: 1, height: "0.5px", background: "#111" }} />
      </div>

      {/* TIERS */}
      <section style={{ padding: "7rem 2rem", maxWidth: 960, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1px",
            background: "#111",
            border: "0.5px solid #111",
          }}
        >
          {tiers.map((tier) => (
            <div
              key={tier.name}
              style={{
                background: tier.featured ? "#0d0d0d" : "#080808",
                padding: "3rem 2rem",
                position: "relative",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {tier.featured && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "1px",
                    background: "#9a7c4a",
                  }}
                />
              )}

              <div
                style={{
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontWeight: 200,
                  fontSize: "0.55rem",
                  letterSpacing: "0.45em",
                  color: tier.textAccent,
                  textTransform: "uppercase",
                  marginBottom: "1.5rem",
                }}
              >
                {tier.featured ? "◆ Most Popular" : "◇ Access Tier"}
              </div>

              <h3
                style={{
                  fontWeight: 300,
                  fontSize: "1.6rem",
                  letterSpacing: "0.08em",
                  color: "#e8e8e8",
                  margin: "0 0 0.25rem",
                }}
              >
                {tier.name}
              </h3>
              <p
                style={{
                  fontStyle: "italic",
                  fontSize: "0.85rem",
                  color: "#3a3a3a",
                  margin: "0 0 2rem",
                  letterSpacing: "0.04em",
                }}
              >
                {tier.description}
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "0.25rem",
                  marginBottom: "2rem",
                }}
              >

{!tier.oneOff && (
  <span
    style={{
      fontFamily: "'Josefin Sans', sans-serif",
      fontSize: "0.55rem",
      letterSpacing: "0.2em",
      color: "#2a2a2a",
      textTransform: "uppercase",
    }}
  >
    / month
  </span>
)}


                <span
                  style={{
                    fontFamily: "'Josefin Sans', sans-serif",
                    fontSize: "0.55rem",
                    letterSpacing: "0.2em",
                    color: "#2a2a2a",
                    textTransform: "uppercase",
                  }}
                >
                  / month
                </span>
              </div>

              <ul
                style={{
                  listStyle: "none",
                  margin: "0 0 2.5rem",
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  flex: 1,
                }}
              >
                {tier.features.map((f) => (
                  <li
                    key={f}
                    style={{
                      fontStyle: "italic",
                      fontSize: "0.85rem",
                      color: "#3a3a3a",
                      letterSpacing: "0.03em",
                      paddingLeft: "1.25rem",
                      position: "relative",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        color: tier.textAccent,
                        fontStyle: "normal",
                        fontSize: "0.6rem",
                        top: "0.2rem",
                      }}
                    >
                      ✦
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                style={{
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontWeight: 300,
                  fontSize: "0.6rem",
                  letterSpacing: "0.35em",
                  textTransform: "uppercase",
                  color: tier.featured ? "#080808" : tier.textAccent,
                  background: tier.featured ? "#c9a96e" : "transparent",
                  textDecoration: "none",
                  padding: "0.85rem 1.5rem",
                  display: "block",
                  textAlign: "center",
                  border: tier.featured ? "none" : `0.5px solid ${tier.accent}`,
                  transition: "opacity 0.2s",
                }}
              >
                {tier.featured ? "Begin Here" : "Select"}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          borderTop: "0.5px solid #111",
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
            color: "#222",
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
                color: "#2a2a2a",
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
            color: "#1a1a1a",
            textTransform: "uppercase",
          }}
        >
          18+ Only · All content is AI-generated synthetic media
        </span>
      </footer>
    </div>
  );
}