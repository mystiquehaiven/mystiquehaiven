"use client";

import { useEffect, useRef, useState } from "react";

const CornerBrackets = ({ color = "#1e1e1e" }: { color?: string }) => (
  <>
    {(["tl", "tr", "bl", "br"] as const).map((c) => (
      <div
        key={c}
        style={{
          position: "absolute",
          width: 24,
          height: 24,
          ...(c.includes("t") ? { top: "2rem" } : { bottom: "2rem" }),
          ...(c.includes("l") ? { left: "2rem" } : { right: "2rem" }),
          borderTop: c.includes("t") ? `0.5px solid ${color}` : undefined,
          borderBottom: c.includes("b") ? `0.5px solid ${color}` : undefined,
          borderLeft: c.includes("l") ? `0.5px solid ${color}` : undefined,
          borderRight: c.includes("r") ? `0.5px solid ${color}` : undefined,
        }}
      />
    ))}
  </>
);

const Divider = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      margin: "3rem auto",
      width: "100%",
      maxWidth: 320,
      justifyContent: "center",
    }}
  >
    <div style={{ flex: 1, height: "0.5px", background: "#1e1e1e" }} />
    <div style={{ width: 5, height: 5, background: "#2a2a2a", transform: "rotate(45deg)" }} />
    <div style={{ flex: 1, height: "0.5px", background: "#1e1e1e" }} />
  </div>
);

const Eyebrow = ({ label }: { label: string }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      marginBottom: "2.5rem",
      justifyContent: "center",
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
      {label}
    </span>
    <div style={{ width: 5, height: 5, background: "#333", transform: "rotate(45deg)" }} />
    <div style={{ width: 60, height: "0.5px", background: "#1e1e1e" }} />
  </div>
);

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, visible };
}

const FadeSection = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  const { ref, visible } = useFadeIn();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: `opacity 0.9s ease ${delay}ms, transform 0.9s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

export default function AboutPage() {
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
      {/* ── HERO ── */}
      <section
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "8rem 2rem 6rem",
          position: "relative",
          textAlign: "center",
        }}
      >
        <CornerBrackets />

        <Eyebrow label="About" />

        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 300,
            fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
            letterSpacing: "0.12em",
            color: "#e8e8e8",
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          MYSTIQUE
          <br />
          <span style={{ color: "#2e2e2e", fontStyle: "italic" }}>hAIven</span>
        </h1>

        <div
          style={{
            width: 1,
            height: 60,
            background: "linear-gradient(to bottom, #1e1e1e, transparent)",
            margin: "3rem auto 0",
          }}
        />
      </section>

      {/* ── PHILOSOPHY ── */}
      <section
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "4rem 2rem 6rem",
          textAlign: "center",
        }}
      >
        <FadeSection>
          <Eyebrow label="Our Philosophy" />
          <p
            style={{
              fontSize: "clamp(1.15rem, 2.5vw, 1.45rem)",
              fontWeight: 300,
              lineHeight: 1.85,
              color: "#c0c0c0",
              margin: 0,
            }}
          >
            {/* PASTE YOUR PHILOSOPHY / ABOUT PARAGRAPH HERE */}
            At MYSTIQUE hAIven, we believe your time is worth more than any subscription fee.
            
            Sure, free content exists everywhere — but finding something actually worth your
            
            attention means sifting through hours of noise, endless feeds designed to keep you
            
            scrolling rather than satisfied. We built MYSTIQUE hAIven on a different philosophy:
            
            quality over quantity, always. Our curated AI-generated content is selected to deliver
            
            exactly what you're looking for, without the algorithm-driven rabbit holes. You
            
            come, you find something great, and you get back to your life. No doom-scrolling. No
            
            filler. Just a premium, purposeful experience that respects the one thing you
            
            can't get back — your time.
            <br />
            
            The Actual Value
<br />
We don't just generate content and throw it up. Every video, every image that makes it onto MYSTIQUE hAIven meets a real standard. High visual fidelity. Coherent composition. Intentional curation. We're selective, which means you don't have to be.

We also maintain a consistent creative vision. All characters are fully synthetic—no real people, no real likenesses—but we do have aesthetic and thematic boundaries. Some content types, some aesthetics, some character types don't fit what we're building. And we think that focused vision is actually better than trying to be everything.
<br />


Trust & Safety
<br />
Every user goes through age verification—this is an adults-only platform. All content is AI-generated with no real people or likenesses involved. Every character depicted is visibly adult. We're intentional about what we create: we strongly avoid any content that could imitate illegal activity. Our guidelines are firm on this, and we build our library accordingly.
<br />
Inside the Platform
<br />
No bloated interfaces. No distracting UI designed to funnel you through endless menus. The platform is straightforward and easy to navigate—find what you're looking for, access your tier, done. Clean design that respects your time.
<br />
---
<br />
Our Ethical Foundation
<br />
We believe synthetic content has a responsibility to be clearly synthetic. All content on MYSTIQUE hAIven is AI-generated with no real people or likenesses involved. Every character depicted is visibly adult.

We're intentional about what we create. We do not generate content that imitates, depicts, or simulates illegal activity. Our content guidelines reflect this commitment: we build a library we can stand behind, and we expect the same integrity from ourselves that we offer you.
<br />
Age verification is mandatory. This is an adults-only platform, and that boundary matters.
<br />
*All content is AI-generated. No real people, no real likenesses.*

          </p>
        </FadeSection>

        <Divider />

        {/* ── ADDITIONAL SECTIONS — paste your other content blocks below ── */}

        <FadeSection delay={100}>
          <Eyebrow label="[ Section Label ]" />
          <p
            style={{
              fontSize: "clamp(1.05rem, 2vw, 1.25rem)",
              fontWeight: 300,
              lineHeight: 1.85,
              color: "#888",
              margin: 0,
            }}
          >
            {/* PASTE ADDITIONAL SECTION CONTENT HERE */}
            Placeholder — replace with your drafted copy.
          </p>
        </FadeSection>

        <Divider />

        <FadeSection delay={150}>
          <Eyebrow label="[ Section Label ]" />
          <p
            style={{
              fontSize: "clamp(1.05rem, 2vw, 1.25rem)",
              fontWeight: 300,
              lineHeight: 1.85,
              color: "#888",
              margin: 0,
            }}
          >
            {/* PASTE ADDITIONAL SECTION CONTENT HERE */}
            Placeholder — replace with your drafted copy.
          </p>
        </FadeSection>
      </section>

      {/* ── CLOSING RULE ── */}
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          margin: "0 auto 6rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          padding: "0 2rem",
        }}
      >
        <div style={{ flex: 1, height: "0.5px", background: "#141414" }} />
        <div style={{ width: 4, height: 4, background: "#222", transform: "rotate(45deg)" }} />
        <div style={{ flex: 1, height: "0.5px", background: "#141414" }} />
      </div>
    </div>
  );
}