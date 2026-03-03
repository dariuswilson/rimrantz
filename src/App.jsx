import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Login from "./pages/Login";
import Feed from "./pages/Feed";
import UsernameSetup from "./pages/UsernameSetup";
import Profile from "./pages/Profile";

export default function App() {
  const [session, setSession] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("feed");

  const fetchUsername = async (userId) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", userId)
        .maybeSingle();
      return data?.username || null;
    } catch (err) {
      console.log("fetch error:", err);
      return null;
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 3000);

    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setSession(null);
          setUsername(null);
          setLoading(false);
          clearTimeout(timeout);
          return;
        }

        setSession(session);
        const name = await fetchUsername(session.user.id);
        setUsername(name);
      } catch (_err) {
        console.log("init error:", _err);
      }

      clearTimeout(timeout);
      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        const name = await fetchUsername(session.user.id);
        setUsername(name);
      } else {
        setUsername(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-orange-500 text-xl">🏀 Loading...</p>
      </div>
    );

  if (!session) return <Login />;
  if (!username)
    return <UsernameSetup user={session.user} onComplete={setUsername} />;
  if (page === "profile")
    return (
      <Profile
        username={username}
        user={session.user}
        onBack={() => setPage("feed")}
      />
    );
  return (
    <Feed
      username={username}
      user={session.user}
      onProfileClick={() => setPage("profile")}
    />
  );
}
