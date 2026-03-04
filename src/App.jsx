import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Login from "./pages/Login";
import Feed from "./pages/Feed";
import UsernameSetup from "./pages/UsernameSetup";
import Profile from "./pages/Profile";
import ViewProfile from "./pages/ViewProfile";
import GameFeed from "./pages/GameFeed";
import Messages from "./pages/Messages";

export default function App() {
  const [session, setSession] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("feed");
  const [viewingUsername, setViewingUsername] = useState(null);
  const [isModerator, setIsModerator] = useState(false);
  const [viewingGame, setViewingGame] = useState(null);
  const [userBucks, setUserBucks] = useState(0);
  const [activeConvo, setActiveConvo] = useState(null);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const rawHeaders = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };

  const fetchProfile = async (userId) => {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?select=username,nba_bucks&user_id=eq.${userId}&limit=1`,
        { headers: rawHeaders },
      );
      const data = await res.json();
      return data?.[0] || null;
    } catch {
      return null;
    }
  };

  const fetchModerator = async (userId) => {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/moderators?select=user_id&user_id=eq.${userId}&limit=1`,
        { headers: rawHeaders },
      );
      const data = await res.json();
      return data?.length > 0;
    } catch {
      return false;
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

        const profile = await fetchProfile(session.user.id);
        setUsername(profile?.username || null);
        setUserBucks(profile?.nba_bucks ?? 500);

        const isMod = await fetchModerator(session.user.id);
        setIsModerator(isMod);
      } catch (err) {
        console.log("init error:", err);
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
        const profile = await fetchProfile(session.user.id);
        setUsername(profile?.username || null);
        setUserBucks(profile?.nba_bucks ?? 500);
        const isMod = await fetchModerator(session.user.id);
        setIsModerator(isMod);
      } else {
        setUsername(null);
        setIsModerator(false);
        setUserBucks(0);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (loading)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#080810" }}
      >
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
        isModerator={isModerator}
        userBucks={userBucks}
        onBack={() => setPage("feed")}
        onViewProfile={(u) => {
          setViewingUsername(u);
          setPage("viewProfile");
        }}
        onMessagesClick={() => setPage("messages")}
      />
    );
  if (page === "viewProfile")
    return (
      <ViewProfile
        username={viewingUsername}
        currentUser={session.user}
        isModerator={isModerator}
        onBack={() => setPage("feed")}
        onViewProfile={(u) => {
          setViewingUsername(u);
          setPage("viewProfile");
        }}
        onDM={(target) => {
          setActiveConvo(target);
          setPage("messages");
        }}
        onMessagesClick={() => setPage("messages")}
      />
    );
  if (page === "gameFeed")
    return (
      <GameFeed
        game={viewingGame}
        user={session.user}
        username={username}
        userBucks={userBucks}
        onBucksUpdate={setUserBucks}
        onProfileClick={() => setPage("profile")}
        onLogout={() => supabase.auth.signOut()}
        onBack={() => setPage("feed")}
        onViewProfile={(u) => {
          setViewingUsername(u);
          setPage("viewProfile");
        }}
        onMessagesClick={() => setPage("messages")}
      />
    );
  if (page === "messages")
    return (
      <Messages
        user={session.user}
        username={username}
        userBucks={userBucks}
        initialConvo={activeConvo}
        onProfileClick={() => setPage("profile")}
        onLogout={() => supabase.auth.signOut()}
        onMessagesClick={() => setPage("messages")}
        onViewProfile={(u) => {
          setViewingUsername(u);
          setPage("viewProfile");
        }}
        onBack={() => setPage("feed")}
      />
    );
  return (
    <Feed
      username={username}
      user={session.user}
      isModerator={isModerator}
      userBucks={userBucks}
      onBucksUpdate={setUserBucks}
      onProfileClick={() => setPage("profile")}
      onViewProfile={(u) => {
        setViewingUsername(u);
        setPage("viewProfile");
      }}
      initialConvo={activeConvo}
      onGameClick={(g) => {
        setViewingGame(g);
        setPage("gameFeed");
      }}
      onMessagesClick={() => setPage("messages")}
    />
  );
}
