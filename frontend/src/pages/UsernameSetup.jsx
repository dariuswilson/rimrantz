import { useState } from "react";
import { containsBlockedTerm } from "../utils/blocklist";
import { supabase } from "../supabase";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// const headers = {
//   apikey: SUPABASE_KEY,
//   Authorization: `Bearer ${SUPABASE_KEY}`,
//   "Content-Type": "application/json",
//   Prefer: "return=minimal",
// };

export default function UsernameSetup({ user }) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!username.trim()) return;
    if (username.length < 3)
      return setError("Username must be at least 3 characters");
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      return setError("Only letters, numbers, and underscores");
    if (containsBlockedTerm(username))
      return setError("That username is not allowed. Please choose another.");

    setLoading(true);
    setError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const authToken = session?.access_token || SUPABASE_KEY;

      const authHeaders = {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      };

      // Check if username exists
      const checkRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?select=username&username=ilike.${username}`,
        { headers: authHeaders },
      );
      const existing = await checkRes.json();
      if (existing.length > 0) {
        setError("Username is already taken!");
        setLoading(false);
        return;
      }

      // Insert profile
      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ user_id: user.id, username }),
      });

      console.log("insert status:", insertRes.status);
      const insertBody = await insertRes.clone().text();
      console.log("insert body:", insertBody);

      if (!insertRes.ok) {
        const err = JSON.parse(insertBody);
        setError(err.message || "Something went wrong");
        setLoading(false);
        return;
      }
    } catch {
      setError("Something went wrong, please try again");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-zinc-900 p-8 rounded-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-orange-500 mb-2">
          🏀 One last step
        </h1>
        <p className="text-zinc-400 mb-6">Choose your username</p>

        <div className="flex items-center bg-zinc-800 rounded-lg px-3 mb-4">
          <span className="text-zinc-500">@</span>
          <input
            type="text"
            placeholder="yourname"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="flex-1 bg-transparent text-white p-3 outline-none"
          />
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || !username.trim()}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold py-3 rounded-lg transition"
        >
          {loading ? "Saving..." : "Let's Go 🔥"}
        </button>
      </div>
    </div>
  );
}
