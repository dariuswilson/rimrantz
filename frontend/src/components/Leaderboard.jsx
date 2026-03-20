import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import iconLeaderboard from "../../assets/images/icons/icon_leaderboard.png";
import iconMoney from "../../assets/images/icons/icon_money.png";

const RANK_STYLES = [
  {
    bg: "linear-gradient(135deg, #f59e0b, #f97316)",
    text: "#000",
    glow: "rgba(245,158,11,0.4)",
  },
  {
    bg: "linear-gradient(135deg, #94a3b8, #cbd5e1)",
    text: "#000",
    glow: "rgba(148,163,184,0.3)",
  },
  {
    bg: "linear-gradient(135deg, #b45309, #d97706)",
    text: "#000",
    glow: "rgba(180,83,9,0.3)",
  },
  { bg: "rgba(255,255,255,0.08)", text: "#a1a1aa", glow: "transparent" },
  { bg: "rgba(255,255,255,0.08)", text: "#a1a1aa", glow: "transparent" },
];

const TABS = [
  { key: "bucks", label: "Bucks", icon: iconMoney },
  { key: "wins", label: "Wins", icon: iconLeaderboard },
  { key: "winpct", label: "Win%", icon: iconLeaderboard },
  { key: "today", label: "Today", icon: iconLeaderboard },
];

export default function Leaderboard({ onViewProfile }) {
  const [activeTab, setActiveTab] = useState("bucks");
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTab = async () => {
      setLoading(true);

      if (activeTab === "bucks") {
        const { data } = await supabase
          .from("profiles")
          .select("username, nba_bucks, avatar_url")
          .order("nba_bucks", { ascending: false })
          .limit(5);
        setLeaders(
          (data || []).map((u) => ({
            username: u.username,
            avatar_url: u.avatar_url,
            value: `💰 ${(u.nba_bucks ?? 0).toLocaleString()}`,
            subvalue: null,
          })),
        );
      } else if (activeTab === "wins") {
        const { data } = await supabase
          .from("predictions")
          .select("user_id")
          .eq("status", "won")
          .not("settled_at", "is", null);

        const counts = {};
        data?.forEach((p) => {
          if (!p.user_id) return;
          if (!counts[p.user_id]) counts[p.user_id] = { user_id: p.user_id, wins: 0 };
          counts[p.user_id].wins++;
        });

        const sorted = Object.values(counts)
          .sort((a, b) => b.wins - a.wins)
          .slice(0, 5);

        const userIds = sorted.map((u) => u.user_id);
        if (userIds.length === 0) {
          setLeaders([]);
          setLoading(false);
          return;
        }

        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url")
          .in("user_id", userIds);

        const profileMap = {};
        profiles?.forEach((p) => {
          if (!p.user_id) return;
          profileMap[p.user_id] = p;
        });

        setLeaders(
          sorted.map((u) => ({
            user_id: u.user_id,
            username: profileMap[u.user_id]?.username || "unknown",
            avatar_url: profileMap[u.user_id]?.avatar_url || null,
            value: `${u.wins} wins`,
            subvalue: null,
          })),
        );
      } else if (activeTab === "winpct") {
        const { data } = await supabase
          .from("predictions")
          .select("user_id, status")
          .in("status", ["won", "lost"])
          .not("settled_at", "is", null);

        const stats = {};
        data?.forEach((p) => {
          if (!p.user_id) return;
          if (!stats[p.user_id]) stats[p.user_id] = { user_id: p.user_id, wins: 0, total: 0 };
          stats[p.user_id].total++;
          if (p.status === "won") stats[p.user_id].wins++;
        });

        const sorted = Object.values(stats)
          .filter((u) => u.total >= 3)
          .map((u) => ({ ...u, pct: Math.round((u.wins / u.total) * 100) }))
          .sort((a, b) => b.pct - a.pct)
          .slice(0, 5);

        if (sorted.length === 0) {
          setLeaders([]);
          setLoading(false);
          return;
        }

        const userIds = sorted.map((u) => u.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url")
          .in("user_id", userIds);

        const profileMap = {};
        profiles?.forEach((p) => {
          if (!p.user_id) return;
          profileMap[p.user_id] = p;
        });

        setLeaders(
          sorted.map((u) => ({
            user_id: u.user_id,
            username: profileMap[u.user_id]?.username || "unknown",
            avatar_url: profileMap[u.user_id]?.avatar_url || null,
            value: `${u.pct}% win rate`,
            subvalue: `${u.wins}/${u.total} bets`,
          })),
        );
      } else if (activeTab === "today") {
        const todayStart = new Date();
        todayStart.setUTCHours(0, 0, 0, 0); // Use UTC midnight to match DB

        const { data } = await supabase
          .from("predictions")
          .select("user_id, username, payout, amount")
          .eq("status", "won")
          .not("settled_at", "is", null)
          .gte("settled_at", todayStart.toISOString());

        const totals = {};
        data?.forEach((p) => {
          if (!totals[p.user_id])
            totals[p.user_id] = { username: p.username, earned: 0 };
          totals[p.user_id].earned += p.payout;
        });

        const sorted = Object.values(totals)
          .sort((a, b) => b.earned - a.earned)
          .slice(0, 5);

        if (sorted.length === 0) {
          setLeaders([]);
          setLoading(false);
          return;
        }

        const usernames = sorted.map((u) => u.username);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .in("username", usernames);

        const avatarMap = {};
        profiles?.forEach((p) => (avatarMap[p.username] = p.avatar_url));

        setLeaders(
          sorted.map((u) => ({
            username: u.username,
            avatar_url: avatarMap[u.username] || null,
            value: `💰 ${u.earned.toLocaleString()} won`,
            subvalue: "today",
          })),
        );
      }

      setLoading(false);
    };

    loadTab();
  }, [activeTab]);

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "linear-gradient(135deg, #0f0f1a 0%, #151525 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
        position: "sticky",
        top: "80px",
      }}
    >
        <div className="flex items-center gap-2 mb-4">
          <img
            src={iconLeaderboard}
            alt="leaderboard"
            className="w-7 h-7"
          />
          <div>
            <p className="text-white text-sm font-bold tracking-tight">
          Leaderboard
            </p>
            <p className="text-zinc-600 text-xs">Top players</p>
          </div>
        </div>

        {/* Tabs */}
      <div
        className="leaderboard-tabs flex gap-1 mb-4 pb-3"
        style={{
          overflowX: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: "#f97316 #1c1c1e",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
            style={{
              background:
                activeTab === tab.key
                  ? "rgba(255,255,255,0.14)"
                  : "rgba(255,255,255,0.06)",
              color: activeTab === tab.key ? "white" : "#71717a",
              border:
                activeTab === tab.key
                  ? "1px solid rgba(255,255,255,0.2)"
                  : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <img
              src={tab.icon}
              alt={tab.label}
              className="w-3.5 h-3.5 object-contain"
              onError={(e) => {
                e.currentTarget.src = iconLeaderboard;
              }}
            />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      <style>{`
  .leaderboard-tabs::-webkit-scrollbar { height: 6px; }
  .leaderboard-tabs::-webkit-scrollbar-track { background: #1c1c1e; border-radius: 999px; }
  .leaderboard-tabs::-webkit-scrollbar-thumb { background: #f97316; border-radius: 999px; }
`}</style>

      {/* List */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-xl animate-pulse"
              style={{ background: "rgba(255,255,255,0.04)" }}
            />
          ))
        ) : leaders.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-zinc-600 text-xs">No data yet today</p>
          </div>
        ) : (
          leaders.map((user, i) => {
            const style = RANK_STYLES[i];
            const isTop3 = i < 3;

            return (
              <div
                key={user.user_id || `${user.username}-${i}`}
                onClick={() => {
                  if (user.username && user.username !== "unknown") {
                    onViewProfile?.(user.username);
                  }
                }}
                className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition group"
                style={{
                  background: isTop3
                    ? "rgba(249,115,22,0.05)"
                    : "rgba(255,255,255,0.02)",
                  border: isTop3
                    ? "1px solid rgba(249,115,22,0.1)"
                    : "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isTop3
                    ? "rgba(249,115,22,0.05)"
                    : "rgba(255,255,255,0.02)";
                }}
              >
                {/* Rank badge */}
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{
                    background: style.bg,
                    color: style.text,
                    boxShadow: isTop3 ? `0 0 8px ${style.glow}` : "none",
                  }}
                >
                  {i + 1}
                </div>

                {/* Avatar */}
                <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user.username?.[0]?.toUpperCase()
                  )}
                </div>

                {/* Name & value */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold truncate group-hover:text-orange-400 transition">
                    @{user.username}
                  </p>
                  <p className="text-zinc-500 text-xs">{user.value}</p>
                  {user.subvalue && (
                    <p className="text-zinc-600 text-xs">{user.subvalue}</p>
                  )}
                </div>

                {i === 0 && <span className="text-sm flex-shrink-0">👑</span>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
