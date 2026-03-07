import { useState } from "react";
import { supabase } from "../supabase";

export default function Login({ isBanned = false }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: "https://nba-hottakes-app.vercel.app",
        },
      });
      if (error) setError(error.message);
      else setVerified(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
    }

    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#080810" }}
    >
      <div
        className="w-full max-w-md p-8 rounded-2xl"
        style={{
          background: "linear-gradient(135deg, #0f0f1a 0%, #151525 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: "linear-gradient(135deg, #f97316, #ef4444)" }}
          >
            🏀
          </div>
          <span
            className="font-black text-2xl tracking-tight"
            style={{
              background: "linear-gradient(90deg, #f97316, #ef4444)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            HotTakes
          </span>
        </div>
        {isBanned && (
          <div
            className="mb-6 px-4 py-3 rounded-xl text-sm"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
            }}
          >
            <p className="text-red-400 font-semibold mb-0.5">
              🔨 Account Banned
            </p>
            <p className="text-red-400/70 text-xs">
              Your account has been banned for violating community guidelines.
              If you believe this is a mistake, please contact support.
            </p>
          </div>
        )}

        <p className="text-zinc-400 text-sm mb-8">
          {isSignUp ? "Create your account" : "Welcome back"}
        </p>

        {verified ? (
          <div className="text-center py-6">
            <p className="text-4xl mb-4">📧</p>
            <h2 className="text-white font-bold text-lg mb-2">
              Check your email!
            </h2>
            <p className="text-zinc-400 text-sm mb-6">
              We sent a verification link to{" "}
              <span className="text-orange-400">{email}</span>. Click it to
              verify and you'll be logged in automatically.
            </p>
            <button
              onClick={() => {
                setVerified(false);
                setIsSignUp(false);
                setEmail("");
                setPassword("");
              }}
              className="text-orange-500 text-sm hover:underline cursor-pointer"
            >
              Back to login
            </button>
          </div>
        ) : (
          <>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full text-white p-3 rounded-xl mb-3 outline-none text-sm transition"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full text-white p-3 rounded-xl mb-5 outline-none text-sm transition"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />

            {error && (
              <div
                className="mb-4 px-3 py-2 rounded-lg text-xs text-red-400"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !email || !password}
              className="w-full font-bold py-3 rounded-xl text-sm transition cursor-pointer disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #f97316, #ef4444)",
                color: "white",
              }}
            >
              {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
            </button>

            <p className="text-zinc-500 text-sm text-center mt-5">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <span
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                }}
                className="text-orange-500 cursor-pointer hover:underline"
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
