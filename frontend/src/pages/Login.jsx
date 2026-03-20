import { useState } from "react";
import { supabase } from "../supabase";
import CommunityGuidelines from "./CommunityGuidelines";

export default function Login({ isBanned = false }) {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);

  const passwordsMatch = confirmPassword && password === confirmPassword;
  const passwordsMismatch = confirmPassword && password !== confirmPassword;

  const handleSubmit = async () => {
    setError("");

    if (mode === "signup") {
      if (!username.trim()) return setError("Username is required.");
      if (username.length < 3)
        return setError("Username must be at least 3 characters.");
      if (!/^[a-zA-Z0-9_]+$/.test(username))
        return setError(
          "Username can only contain letters, numbers, and underscores.",
        );
      if (password.length < 6)
        return setError("Password must be at least 6 characters.");
      if (password !== confirmPassword)
        return setError("Passwords don't match.");
    }

    setLoading(true);

    if (mode === "signup") {
      const { data: existing } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username.toLowerCase())
        .maybeSingle();

      if (existing) {
        setError("That username is already taken.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: "https://nba-hottakes-app.vercel.app",
          data: { username: username.toLowerCase() },
        },
      });
      if (error) setError(error.message);
      else setVerified(true);
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("banned")
          .eq("user_id", data.user.id)
          .single();
        if (profile?.banned) {
          await supabase.auth.signOut();
          setError(
            "Your account has been banned for violating community guidelines.",
          );
        }
      }
    }

    setLoading(false);
  };

  const switchMode = (m) => {
    setMode(m);
    setError("");
    setEmail("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
  };

  if (showGuidelines) {
    return <CommunityGuidelines onBack={() => setShowGuidelines(false)} />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#07070e",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Bebas+Neue&display=swap');
        @keyframes floatOrb1 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(30px,-40px) scale(1.08);} }
        @keyframes floatOrb2 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(-20px,30px) scale(1.05);} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
        @keyframes spin { to{transform:rotate(360deg);} }
        @keyframes ballBounce { 0%,100%{transform:translateY(0) rotate(0deg);} 40%{transform:translateY(-8px) rotate(-8deg);} 70%{transform:translateY(-3px) rotate(5deg);} }
        @keyframes shimmerText {
          0%{background-position:0% 50%;}
          50%{background-position:100% 50%;}
          100%{background-position:0% 50%;}
        }
        .rr-input {
          width: 100%; box-sizing: border-box;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; padding: 13px 16px;
          color: white; font-size: 14px; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .rr-input::placeholder { color: #3f3f46; }
        .rr-input:focus {
          border-color: rgba(249,115,22,0.5);
          box-shadow: 0 0 0 3px rgba(249,115,22,0.07);
          background: rgba(255,255,255,0.06);
        }
        .rr-input.match { border-color: rgba(34,197,94,0.4); }
        .rr-input.mismatch { border-color: rgba(239,68,68,0.4); }
        .rr-btn {
          width: 100%; padding: 14px; border-radius: 14px; border: none;
          background: linear-gradient(135deg, #f97316 0%, #ef4444 100%);
          color: white; font-weight: 800; font-size: 15px; cursor: pointer;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 24px rgba(249,115,22,0.3);
          letter-spacing: 0.01em;
        }
        .rr-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 32px rgba(249,115,22,0.4); }
        .rr-btn:active:not(:disabled) { transform: translateY(0); }
        .rr-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .rr-card { animation: fadeSlideUp 0.45s ease both; }
        .rr-ball { animation: ballBounce 2.4s ease-in-out infinite; display:inline-block; }
        .rr-logo {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 42px; letter-spacing: 2px;
          background: linear-gradient(135deg, #f97316 0%, #fbbf24 40%, #ef4444 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          animation: shimmerText 4s ease infinite;
        }
        .tab-btn {
          flex: 1; padding: 9px 0; border-radius: 10px; border: none;
          font-size: 13px; font-weight: 700; cursor: pointer;
          transition: all 0.2s; letter-spacing: 0.02em;
        }
        .tab-active {
          background: linear-gradient(135deg, #f97316, #ef4444);
          color: white; box-shadow: 0 4px 14px rgba(249,115,22,0.35);
        }
        .tab-inactive { background: transparent; color: #52525b; }
        .field-label {
          display: block; font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: #52525b; margin-bottom: 7px;
        }
      `}</style>

      {/* Bg orbs */}
      <div
        style={{
          position: "absolute",
          top: "-15%",
          left: "-10%",
          width: "560px",
          height: "560px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(249,115,22,0.11) 0%, transparent 68%)",
          animation: "floatOrb1 9s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          right: "-5%",
          width: "480px",
          height: "480px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(239,68,68,0.07) 0%, transparent 68%)",
          animation: "floatOrb2 12s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      {/* Grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(249,115,22,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(249,115,22,0.025) 1px,transparent 1px)",
          backgroundSize: "56px 56px",
          pointerEvents: "none",
        }}
      />

      <div
        className="rr-card"
        style={{ width: "100%", maxWidth: "420px", margin: "0 16px" }}
      >
        <div
          style={{
            background: "linear-gradient(160deg,#0e0e1c 0%,#111120 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "24px",
            padding: "36px 36px 32px",
            boxShadow:
              "0 40px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div style={{ marginBottom: "10px" }}>
              <span className="rr-ball" style={{ fontSize: "44px" }}>
                🏀
              </span>
            </div>
            <div className="rr-logo">RimRantz</div>
            <p style={{ color: "#3f3f46", fontSize: "13px", marginTop: "4px" }}>
              {isBanned
                ? "Account suspended"
                : mode === "signup"
                  ? "Join the conversation"
                  : "Good to have you back"}
            </p>
          </div>

          {/* Banned state */}
          {isBanned && (
            <div
              style={{
                background: "rgba(239,68,68,0.07)",
                border: "1px solid rgba(239,68,68,0.18)",
                borderRadius: "12px",
                padding: "14px 16px",
                marginBottom: "20px",
              }}
            >
              <p
                style={{
                  color: "#f87171",
                  fontWeight: 700,
                  fontSize: "13px",
                  marginBottom: "3px",
                }}
              >
                🔨 Account Banned
              </p>
              <p
                style={{
                  color: "rgba(248,113,113,0.55)",
                  fontSize: "12px",
                  lineHeight: 1.5,
                }}
              >
                Banned for violating community guidelines. Contact support if
                you think this is a mistake.
              </p>
            </div>
          )}

          {verified ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: "52px", marginBottom: "14px" }}>📧</div>
              <h2
                style={{
                  color: "white",
                  fontWeight: 800,
                  fontSize: "18px",
                  marginBottom: "8px",
                }}
              >
                Check your inbox!
              </h2>
              <p
                style={{
                  color: "#71717a",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  marginBottom: "24px",
                }}
              >
                We sent a link to{" "}
                <span style={{ color: "#f97316", fontWeight: 600 }}>
                  {email}
                </span>
                .<br />
                Click it to verify and you're in.
              </p>
              <button
                onClick={() => switchMode("signin")}
                style={{
                  color: "#f97316",
                  fontSize: "14px",
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  fontWeight: 600,
                }}
              >
                ← Back to sign in
              </button>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div
                style={{
                  display: "flex",
                  gap: "4px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "13px",
                  padding: "4px",
                  marginBottom: "24px",
                }}
              >
                <button
                  className={`tab-btn ${mode === "signin" ? "tab-active" : "tab-inactive"}`}
                  onClick={() => switchMode("signin")}
                >
                  Sign In
                </button>
                <button
                  className={`tab-btn ${mode === "signup" ? "tab-active" : "tab-inactive"}`}
                  onClick={() => switchMode("signup")}
                >
                  Sign Up
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {/* Email */}
                <div>
                  <label className="field-label">Email</label>
                  <input
                    className="rr-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  />
                </div>

                {/* Username - signup only */}
                {mode === "signup" && (
                  <div>
                    <label className="field-label">Username</label>
                    <div style={{ position: "relative" }}>
                      <span
                        style={{
                          position: "absolute",
                          left: "15px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#f97316",
                          fontWeight: 700,
                          fontSize: "14px",
                          pointerEvents: "none",
                        }}
                      >
                        @
                      </span>
                      <input
                        className="rr-input"
                        style={{ paddingLeft: "30px" }}
                        type="text"
                        placeholder="yourhandle"
                        value={username}
                        onChange={(e) =>
                          setUsername(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9_]/g, ""),
                          )
                        }
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      />
                    </div>
                    <p
                      style={{
                        color: "#3f3f46",
                        fontSize: "11px",
                        marginTop: "5px",
                      }}
                    >
                      Letters, numbers, underscores · min. 3 chars
                    </p>
                  </div>
                )}

                {/* Password */}
                <div>
                  <label className="field-label">Password</label>
                  <input
                    className="rr-input"
                    type="password"
                    placeholder={
                      mode === "signup" ? "Min. 6 characters" : "••••••••"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  />
                </div>

                {/* Confirm password - signup only */}
                {mode === "signup" && (
                  <div>
                    <label className="field-label">Confirm Password</label>
                    <input
                      className={`rr-input ${passwordsMatch ? "match" : passwordsMismatch ? "mismatch" : ""}`}
                      type="password"
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    />
                    {passwordsMatch && (
                      <p
                        style={{
                          color: "#22c55e",
                          fontSize: "11px",
                          marginTop: "5px",
                        }}
                      >
                        ✓ Passwords match
                      </p>
                    )}
                    {passwordsMismatch && (
                      <p
                        style={{
                          color: "#ef4444",
                          fontSize: "11px",
                          marginTop: "5px",
                        }}
                      >
                        ✗ Passwords don't match
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div
                  style={{
                    marginTop: "16px",
                    background: "rgba(239,68,68,0.07)",
                    border: "1px solid rgba(239,68,68,0.18)",
                    borderRadius: "12px",
                    padding: "12px 14px",
                  }}
                >
                  <p style={{ color: "#f87171", fontSize: "13px" }}>
                    ⚠️ {error}
                  </p>
                </div>
              )}

              {/* Submit */}
              <button
                className="rr-btn"
                onClick={handleSubmit}
                disabled={
                  loading ||
                  !email ||
                  !password ||
                  (mode === "signup" &&
                    (!username || !confirmPassword || passwordsMismatch))
                }
                style={{ marginTop: "22px" }}
              >
                {loading ? (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid rgba(255,255,255,0.25)",
                        borderTopColor: "white",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                        display: "inline-block",
                      }}
                    />
                    {mode === "signup"
                      ? "Creating account..."
                      : "Signing in..."}
                  </span>
                ) : mode === "signup" ? (
                  "Create Account 🏀"
                ) : (
                  "Sign In →"
                )}
              </button>

              <p
                style={{
                  color: "#27272a",
                  fontSize: "11px",
                  textAlign: "center",
                  marginTop: "16px",
                  lineHeight: 1.5,
                }}
              >
                By continuing you agree to the{" "}
                <span
                  onClick={() => setShowGuidelines(true)}
                  style={{
                    color: "#f97316",
                    cursor: "pointer",
                    textDecoration: "underline",
                    textDecorationStyle: "dotted",
                  }}
                >
                  RimRantz Community Guidelines
                </span>
                .
              </p>
            </>
          )}
        </div>

        <p
          style={{
            color: "#1c1c1e",
            fontSize: "12px",
            textAlign: "center",
            marginTop: "18px",
          }}
        >
          🏀 RimRantz · Your home for NBA discussion
        </p>
      </div>
    </div>
  );
}
