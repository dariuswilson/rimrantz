import { useState, useEffect, useRef } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
} from "react-router-dom";
import { supabase } from "./supabase";
import Login from "./pages/Login";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import ViewProfile from "./pages/ViewProfile";
import GameFeed from "./pages/GameFeed";
import Messages from "./pages/Messages";
import TransactionsModal from "./pages/TransactionsModal";
import ModeratorPanel from "./pages/ModeratorPanel";
import CommunityGuidelines from "./pages/CommunityGuidelines";
import Shop from "./pages/Shop";

function ViewProfileWrapper(props) {
  const { username } = useParams();
  return <ViewProfile {...props} username={username} />;
}

function GameFeedWrapper({ viewingGame, ...props }) {
  const navigate = useNavigate();
  if (!viewingGame) return <Navigate to="/" replace />;
  return <GameFeed {...props} game={viewingGame} onBack={() => navigate(-1)} />;
}

function AppInner() {
  const [session, setSession] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModerator, setIsModerator] = useState(false);
  const [viewingGame, setViewingGame] = useState(null);
  const [userBucks, setUserBucks] = useState(0);
  const [activeConvo, setActiveConvo] = useState(null);
  const [showTransactions, setShowTransactions] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isBanned, setIsBanned] = useState(false);
  const settleIntervalRef = useRef(null);
  const navigate = useNavigate();

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const rawHeaders = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };

  const fetchProfile = async (userId) => {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?select=username,nba_bucks,banned&user_id=eq.${userId}&limit=1`,
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

  const settleUserBets = async (userId) => {
    try {
      const ABBR_MAP = {
        SA: "SAS",
        NO: "NOP",
        GS: "GSW",
        WSH: "WAS",
        NY: "NYK",
        UTAH: "UTA",
        PHX: "PHX",
        BKN: "BKN",
        BRK: "BKN",
        CHA: "CHA",
        CHO: "CHA",
        DAL: "DAL",
        DEN: "DEN",
        DET: "DET",
        HOU: "HOU",
        IND: "IND",
        LAC: "LAC",
        LAL: "LAL",
        MEM: "MEM",
        MIA: "MIA",
        MIL: "MIL",
        MIN: "MIN",
        OKC: "OKC",
        ORL: "ORL",
        PHI: "PHI",
        POR: "POR",
        SAC: "SAC",
        TOR: "TOR",
        ATL: "ATL",
        BOS: "BOS",
        CHI: "CHI",
        CLE: "CLE",
        NOP: "NOP",
        NYK: "NYK",
        SAS: "SAS",
        UTA: "UTA",
        WAS: "WAS",
        GSW: "GSW",
      };
      const normalizeTeam = (abbr) => ABBR_MAP[abbr] || abbr;

      const res = await fetch("/api/nba-scores");
      const data = await res.json();
      const finishedGames = (data.games || []).filter(
        (g) => g.status === "closed",
      );
      if (finishedGames.length === 0) return;

      const { data: pending } = await supabase
        .from("predictions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "pending")
        .is("settled_at", null);

      if (!pending || pending.length === 0) return;

      let totalWinnings = 0;
      for (const pred of pending) {
        const game = finishedGames.find((g) => g.id === pred.game_id);
        if (!game) continue;
        const homeScore = game.score[game.home];
        const awayScore = game.score[game.away];
        const winner = homeScore > awayScore ? game.home : game.away;
        const won = normalizeTeam(winner) === normalizeTeam(pred.team_picked);
        await supabase
          .from("predictions")
          .update({
            status: won ? "won" : "lost",
            settled_at: new Date().toISOString(),
          })
          .eq("id", pred.id);
        if (won) totalWinnings += pred.payout;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("nba_bucks")
        .eq("user_id", userId)
        .single();

      let newBalance = (profile?.nba_bucks || 0) + totalWinnings;
      if (newBalance <= 0) newBalance = 10;
      await supabase
        .from("profiles")
        .update({ nba_bucks: newBalance })
        .eq("user_id", userId);
      setUserBucks(newBalance);
    } catch {
      /* continue */
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

        if (profile?.banned) {
          await supabase.auth.signOut();
          setIsBanned(true);
          setLoading(false);
          clearTimeout(timeout);
          return;
        }

        setUsername(profile?.username || null);
        setUserBucks(profile?.nba_bucks ?? 500);

        const isMod = await fetchModerator(session.user.id);
        setIsModerator(isMod);

        await fetchUnreadCount(session.user.id);
        await settleUserBets(session.user.id);

        settleIntervalRef.current = setInterval(
          () => settleUserBets(session.user.id),
          120000,
        );

        // eslint-disable-next-line no-unused-vars
        const msgChannel = supabase
          .channel("unread-count")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "messages" },
            () => fetchUnreadCount(session.user.id),
          )
          .subscribe();
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
        if (profile?.banned) {
          await supabase.auth.signOut();
          setIsBanned(true);
          return;
        }
        setUsername(profile?.username || null);
        setUserBucks(profile?.nba_bucks ?? 500);
        const isMod = await fetchModerator(session.user.id);
        setIsModerator(isMod);
      } else {
        setUsername(null);
        setIsModerator(false);
        setUserBucks(0);
        setUnreadCount(0);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
      clearInterval(settleIntervalRef.current);
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

  if (!session) return <Login isBanned={isBanned} />;

  const sharedProps = {
    user: session.user,
    username,
    userBucks,
    isModerator,
    unreadCount,
    onBucksUpdate: setUserBucks,
    onUnreadUpdate: (count) => setUnreadCount(count),
    onBucksClick: () => setShowTransactions(true),
    onShopClick: () => navigate("/shop"),
    onMessagesClick: () => navigate("/messages"),
    onProfileClick: () => navigate("/profile"),
    onModPanelClick: () => navigate("/mod"),
    onViewProfile: (u) => navigate(`/user/${u}`),
    onLogout: () => supabase.auth.signOut(),
    onGameClick: (g) => {
      setViewingGame(g);
      navigate(`/game/${g.id}`);
    },
    onDM: (target) => {
      setActiveConvo(target);
      navigate("/messages");
    },
  };

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

      <Routes>
        <Route path="/" element={<Feed {...sharedProps} />} />
        <Route
          path="/profile"
          element={<Profile {...sharedProps} onBack={() => navigate("/")} />}
        />
        <Route
          path="/user/:username"
          element={
            <ViewProfileWrapper
              {...sharedProps}
              currentUser={session.user}
              currentUsername={username}
              currentUserBucks={userBucks}
              onBack={() => navigate(-1)}
            />
          }
        />
        <Route
          path="/messages"
          element={
            <Messages
              {...sharedProps}
              initialConvo={activeConvo}
              onBack={() => navigate("/")}
            />
          }
        />
        <Route
          path="/game/:gameId"
          element={
            <GameFeedWrapper {...sharedProps} viewingGame={viewingGame} />
          }
        />
        <Route
          path="/mod"
          element={
            <ModeratorPanel {...sharedProps} onBack={() => navigate("/")} />
          }
        />
        <Route
          path="/guidelines"
          element={<CommunityGuidelines onBack={() => navigate(-1)} />}
        />
        <Route
          path="/shop"
          element={<Shop {...sharedProps} onBack={() => navigate("/")} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
