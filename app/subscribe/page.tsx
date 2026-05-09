export default function SubscribePage() {
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
            textTransform: "uppercase",
          }}
        >
          ✦
        </span>
        <div style={{ flex: 1, height: "1px", backgroundColor: "#c8a97e33" }} />
      </div>

      {/* Main content */}
      <div
        style={{
          textAlign: "center",
          maxWidth: "480px",
          width: "100%",
        }}
      >
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
            marginBottom: "2rem",
            letterSpacing: "0.02em",
          }}
        >
          The Haven
          <br />
          <em style={{ color: "#c8a97e", fontStyle: "italic" }}>Awakens Soon</em>
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
          Subscription tiers are being prepared. Those who have already entered
          may continue to explore the free preview — full access is nearly upon
          you.
        </p>

        {/* Tier preview pills */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "0.75rem",
            flexWrap: "wrap",
            marginBottom: "3rem",
          }}
        >
          {["Standard", "Exclusive"].map((tier) => (
            <span
              key={tier}
              style={{
                fontFamily: "'Josefin Sans', sans-serif",
                fontSize: "0.55rem",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "#c8a97e99",
                border: "1px solid #c8a97e22",
                padding: "0.4rem 1rem",
                borderRadius: "2px",
              }}
            >
              {tier}
            </span>
          ))}
        </div>
      </div>

      {/* Decorative bottom rule */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginTop: "1rem",
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
            textTransform: "uppercase",
          }}
        >
          ✦
        </span>
        <div style={{ flex: 1, height: "1px", backgroundColor: "#c8a97e33" }} />
      </div>
    </main>
  );
}