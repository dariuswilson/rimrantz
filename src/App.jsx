import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Login from "./pages/Login";
import Feed from "./pages/Feed";
import UsernameSetup from "./pages/UsernameSetup";
import Profile from "./pages/Profile";
import ViewProfile from "./pages/ViewProfile";
import GameFeed from "./pages/GameFeed";
import Messages from "./pages/Messages";
import TransactionsModal from "./pages/TransactionsModal";

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
  const [showTransactions, setShowTransactions] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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

  const fetchUnreadCount = async (userId) => {
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", userId)
      .eq("read", false);
    setUnreadCount(count || 0);
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
        await fetchUnreadCount(session.user.id);
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
        await fetchUnreadCount(session.user.id);
      } else {
        setUsername(null);
        setIsModerator(false);
        setUserBucks(0);
        setUnreadCount(0);
      }
    });

    // Realtime unread count listener — outside init so cleanup works
    const msgChannel = supabase
      .channel("unread-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) fetchUnreadCount(session.user.id);
          });
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(msgChannel);
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

  return (
    <>
      {showTransactions && (
        <TransactionsModal
          userId={session.user.id}
          username={username}
          onClose={() => setShowTransactions(false)}
          onBucksUpdate={(newBalance) => setUserBucks(newBalance)}
        />
      )}

      {page === "profile" && (
        <Profile
          username={username}
          user={session.user}
          isModerator={isModerator}
          userBucks={userBucks}
          onBack={() => setPage("feed")}
          onProfileClick={() => setPage("profile")}
          onViewProfile={(u) => {
            setViewingUsername(u);
            setPage("viewProfile");
          }}
          onMessagesClick={() => {
            setUnreadCount(0);
            setPage("messages");
          }}
          onBucksClick={() => setShowTransactions(true)}
          unreadCount={unreadCount}
        />
      )}

      {page === "viewProfile" && (
        <ViewProfile
          username={viewingUsername}
          currentUser={session.user}
          currentUsername={username}
          currentUserBucks={userBucks}
          isModerator={isModerator}
          onBack={() => setPage("feed")}
          onProfileClick={() => setPage("profile")}
          onViewProfile={(u) => {
            setViewingUsername(u);
            setPage("viewProfile");
          }}
          onDM={(target) => {
            setActiveConvo(target);
            setPage("messages");
          }}
          onMessagesClick={() => {
            setUnreadCount(0);
            setPage("messages");
          }}
          unreadCount={unreadCount}
          onBucksClick={() => setShowTransactions(true)}
        />
      )}

      {page === "gameFeed" && (
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
          onMessagesClick={() => {
            setUnreadCount(0);
            setPage("messages");
          }}
          unreadCount={unreadCount}
          onBucksClick={() => setShowTransactions(true)}
        />
      )}

      {page === "messages" && (
        <Messages
          user={session.user}
          username={username}
          userBucks={userBucks}
          initialConvo={activeConvo}
          onProfileClick={() => setPage("profile")}
          onLogout={() => supabase.auth.signOut()}
          onMessagesClick={() => {
            setUnreadCount(0);
            setPage("messages");
          }}
          onViewProfile={(u) => {
            setViewingUsername(u);
            setPage("viewProfile");
          }}
          onBack={() => setPage("feed")}
          unreadCount={unreadCount}
          onBucksClick={() => setShowTransactions(true)}
        />
      )}

      {page === "feed" && (
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
          onGameClick={(g) => {
            setViewingGame(g);
            setPage("gameFeed");
          }}
          onMessagesClick={() => {
            setUnreadCount(0);
            setPage("messages");
          }}
          unreadCount={unreadCount}
          onBucksClick={() => setShowTransactions(true)}
        />
      )}
    </>
  );
}
