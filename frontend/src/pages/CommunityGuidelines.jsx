export default function CommunityGuidelines({ onBack }) {
  const sections = [
    {
      emoji: "🏀",
      title: "1. Keep it about basketball (mostly)",
      body: "RimRantz is built around NBA discussion. While casual conversation is welcome, the platform centers on games, players, trades, and predictions. Stay on topic in game threads and group chats.",
      bullets: [
        "Post takes, reactions, predictions, and analysis related to NBA games and players.",
        "Game threads are for real-time game discussion — keep them focused.",
        "Healthy debates are encouraged. Trash talk is fine as long as it stays lighthearted.",
      ],
    },
    {
      emoji: "🤝",
      title: "2. Respect other users",
      body: "Disagreements about basketball are part of the fun. Disrespecting people personally is not.",
      bullets: [
        "No harassment, targeted insults, or bullying of other members.",
        "No hate speech — including racism, sexism, homophobia, or discrimination of any kind.",
        "Do not send threatening or abusive messages.",
        'Criticize takes, not people. "That take is wrong because..." is fine. Personal attacks are not.',
      ],
    },
    {
      emoji: "🚫",
      title: "3. No spam or low-effort content",
      body: "We want quality discussion, not noise.",
      bullets: [
        "Do not spam the same take or comment repeatedly.",
        "No self-promotion, advertisements, or off-topic external links.",
        "Don't post content purely to farm reactions or bucks.",
        'Low-effort posts like "first" or single-character comments will be removed.',
      ],
    },
    {
      emoji: "💰",
      title: "4. Betting & NBA Bucks",
      body: "NBA Bucks is virtual currency — it's for fun. Treat it like a game.",
      bullets: [
        "Do not attempt to manipulate outcomes, exploit bugs, or coordinate to farm bucks.",
        "If you run out of bucks, you'll receive a small amount to keep playing. Abusing this is not allowed.",
        "Intentional collusion to affect leaderboard standings may result in account action.",
      ],
    },
    {
      emoji: "🔍",
      title: "5. No misinformation",
      body: "NBA rumors fly fast — that's part of the fun. But be responsible about it.",
      bullets: [
        "Clearly label speculation as speculation. Don't present rumors as confirmed facts.",
        "Don't fabricate quotes, stats, or injury reports.",
        "If you see misinformation, use the report button rather than arguing in the comments.",
      ],
    },
    {
      emoji: "🚩",
      title: "6. Reporting content",
      body: "We rely on the community to help keep RimRantz clean. Use the 🚩 report button on any post, comment, or profile that violates these guidelines. Do not abuse the report system to target users you disagree with — false reporting is itself a violation.",
      bullets: [],
    },
    {
      emoji: "🛡️",
      title: "7. Enforcement",
      body: "Violations may result in the following actions depending on severity:",
      bullets: [
        "Strike — A formal warning. Three strikes result in an automatic shadowban.",
        "Shadowban — Your content is hidden from other users. You can still use the app but posts won't be visible.",
        "Ban — Your account is locked. Bans are issued for serious or repeat violations.",
      ],
      footer:
        "Moderators reserve the right to take action on content that violates the spirit of these guidelines, even if not explicitly listed above.",
    },
    {
      emoji: "📬",
      title: "8. Appeals",
      body: "If you believe a moderation action was taken in error, contact the RimRantz team to appeal. Include your username and a brief explanation. We review all appeals and will respond as soon as possible.",
      bullets: [],
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#07070e",
        fontFamily: "'Inter', sans-serif",
        color: "white",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Bebas+Neue&display=swap');
        @keyframes floatOrb1 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(20px,-30px) scale(1.06);} }
        @keyframes floatOrb2 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(-15px,20px) scale(1.04);} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }
        .cg-section { animation: fadeUp 0.4s ease both; }
        .cg-back:hover { background: rgba(249,115,22,0.12) !important; color: #f97316 !important; }
        .cg-bullet::before {
          content: '';
          display: inline-block;
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #f97316;
          margin-right: 10px;
          flex-shrink: 0;
          margin-top: 6px;
        }
        .rr-logo-cg {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 32px; letter-spacing: 2px;
          background: linear-gradient(135deg, #f97316 0%, #fbbf24 40%, #ef4444 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* Bg orbs */}
      <div
        style={{
          position: "fixed",
          top: "-10%",
          left: "-10%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 68%)",
          animation: "floatOrb1 10s ease-in-out infinite",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "-15%",
          right: "-5%",
          width: "420px",
          height: "420px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 68%)",
          animation: "floatOrb2 13s ease-in-out infinite",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(249,115,22,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(249,115,22,0.02) 1px,transparent 1px)",
          backgroundSize: "56px 56px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "720px",
          margin: "0 auto",
          padding: "32px 20px 80px",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          {onBack && (
            <button
              className="cg-back"
              onClick={onBack}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "8px 16px",
                color: "#71717a",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                flexShrink: 0,
              }}
            >
              ← Back
            </button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "22px" }}>🏀</span>
            <span className="rr-logo-cg">RimRantz</span>
          </div>
        </div>

        {/* Hero */}
        <div style={{ marginBottom: "48px" }}>
          <h1
            style={{
              fontSize: "clamp(28px, 6vw, 42px)",
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: "12px",
            }}
          >
            Community{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #f97316, #ef4444)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Guidelines
            </span>
          </h1>
          <p
            style={{ color: "#52525b", fontSize: "14px", marginBottom: "16px" }}
          >
            Effective March 2026 · Version 1.0
          </p>
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(249,115,22,0.06), rgba(239,68,68,0.04))",
              border: "1px solid rgba(249,115,22,0.15)",
              borderRadius: "16px",
              padding: "18px 22px",
            }}
          >
            <p
              style={{
                color: "#a1a1aa",
                fontSize: "14px",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              RimRantz is a community for NBA fans to discuss games, players,
              trades, predictions, and everything basketball. We want this to be
              a place where fans of all teams can debate freely and have fun —
              without toxicity getting in the way. These guidelines apply to all
              content on RimRantz, including takes, comments, messages, and your
              profile.
            </p>
          </div>
        </div>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {sections.map((section, i) => (
            <div
              key={i}
              className="cg-section"
              style={{
                animationDelay: `${i * 50}ms`,
                background: "linear-gradient(135deg, #0e0e1c 0%, #111120 100%)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "20px",
                padding: "24px 28px",
              }}
            >
              {/* Section header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    flexShrink: 0,
                    background: "rgba(249,115,22,0.1)",
                    border: "1px solid rgba(249,115,22,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "17px",
                  }}
                >
                  {section.emoji}
                </div>
                <h2
                  style={{
                    fontSize: "15px",
                    fontWeight: 800,
                    color: "white",
                    margin: 0,
                  }}
                >
                  {section.title}
                </h2>
              </div>

              {/* Body */}
              <p
                style={{
                  color: "#71717a",
                  fontSize: "13.5px",
                  lineHeight: 1.7,
                  marginBottom: section.bullets.length ? "14px" : 0,
                }}
              >
                {section.body}
              </p>

              {/* Bullets */}
              {section.bullets.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {section.bullets.map((bullet, j) => (
                    <div
                      key={j}
                      className="cg-bullet"
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        color: "#a1a1aa",
                        fontSize: "13.5px",
                        lineHeight: 1.6,
                      }}
                    >
                      {bullet}
                    </div>
                  ))}
                </div>
              )}

              {/* Footer note */}
              {section.footer && (
                <p
                  style={{
                    color: "#52525b",
                    fontSize: "12.5px",
                    lineHeight: 1.6,
                    marginTop: "14px",
                    fontStyle: "italic",
                    margin: "14px 0 0",
                  }}
                >
                  {section.footer}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div
          style={{
            marginTop: "40px",
            background:
              "linear-gradient(135deg, rgba(249,115,22,0.08), rgba(239,68,68,0.05))",
            border: "1px solid rgba(249,115,22,0.15)",
            borderRadius: "20px",
            padding: "28px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "22px", marginBottom: "8px" }}>🏀</p>
          <p
            style={{
              color: "white",
              fontWeight: 700,
              fontSize: "15px",
              marginBottom: "6px",
            }}
          >
            Ready to join the conversation?
          </p>
          <p
            style={{ color: "#52525b", fontSize: "13px", marginBottom: "20px" }}
          >
            Keep these guidelines in mind and you'll fit right in.
          </p>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: "linear-gradient(135deg, #f97316, #ef4444)",
                border: "none",
                borderRadius: "12px",
                padding: "11px 28px",
                color: "white",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(249,115,22,0.3)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 28px rgba(249,115,22,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow =
                  "0 4px 20px rgba(249,115,22,0.3)";
              }}
            >
              ← Back to RimRantz
            </button>
          )}
        </div>

        <p
          style={{
            color: "#1c1c1e",
            fontSize: "12px",
            textAlign: "center",
            marginTop: "32px",
          }}
        >
          RimRantz · Community Guidelines · v1.0 · 2026
        </p>
      </div>
    </div>
  );
}
