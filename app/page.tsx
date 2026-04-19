import WaitlistForm from "@/components/WaitlistForm";

export default function Home() {
  return (
    <div style={{ background: "#080808", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem 2rem", position: "relative" }}>
      <div style={{ position: "absolute", top: "2rem", left: "2rem", right: "2rem", bottom: "2rem", pointerEvents: "none" }}>
        {["tl","tr","bl","br"].map(c => (
          <div key={c} style={{ position: "absolute", width: 20, height: 20, ...(c.includes("t") ? { top: 0 } : { bottom: 0 }), ...(c.includes("l") ? { left: 0 } : { right: 0 }), borderTop: c.includes("t") ? "0.5px solid #1e1e1e" : undefined, borderBottom: c.includes("b") ? "0.5px solid #1e1e1e" : undefined, borderLeft: c.includes("l") ? "0.5px solid #1e1e1e" : undefined, borderRight: c.includes("r") ? "0.5px solid #1e1e1e" : undefined }} />
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
          <div style={{ width: 60, height: "0.5px", background: "#2a2a2a" }} />
          <div style={{ width: 6, height: 6, background: "#444", transform: "rotate(45deg)" }} />
          <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 200, fontSize: "0.65rem", letterSpacing: "0.4em", color: "#444", textTransform: "uppercase" }}>Coming Soon</span>
          <div style={{ width: 6, height: 6, background: "#444", transform: "rotate(45deg)" }} />
          <div style={{ width: 60, height: "0.5px", background: "#2a2a2a" }} />
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: "3.2rem", color: "#e8e8e8", letterSpacing: "0.08em", margin: "0 0 0.25rem", textAlign: "center", lineHeight: 1.1 }}>
          MYSTIQUE <span style={{ fontStyle: "italic", color: "#888", fontSize: "2.8rem" }}>hAIven</span>
        </h1>
        <div style={{ width: 40, height: "0.5px", background: "#2a2a2a", margin: "1.5rem auto" }} />
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 300, fontSize: "1.05rem", color: "#555", letterSpacing: "0.06em", margin: "0 0 2.5rem", textAlign: "center" }}>
          THE BEST NSFW AI GALLERY ON THE NET
        </p>
        <WaitlistForm />
      </div>
    </div>
  );
}