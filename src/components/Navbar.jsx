import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function Navbar({
  username,
  avatarUrl,
  userBucks,
  onProfileClick,
  onLogout,
  onMessagesClick,
  onBucksClick,
  onShopClick,
  unreadCount = 0,
  isModerator = false,
  onModPanelClick,
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showBucksMenu, setShowBucksMenu] = useState(false);
  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const bucksRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
        setSearch("");
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (bucksRef.current && !bucksRef.current.contains(e.target)) {
        setShowBucksMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      const timeout = setTimeout(() => {
        setResults([]);
        setShowResults(false);
      }, 0);
      return () => clearTimeout(timeout);
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from("profiles")
        .select("username, avatar_url, nba_bucks, favorite_team")
        .ilike("username", `%${search}%`)
        .limit(8);
      setResults(data || []);
      setShowResults(true);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleSelect = (u) => {
    setShowResults(false);
    setSearch("");
    navigate(`/user/${u.username}`);
  };

  return (
    <div
      className="sticky top-0 z-50 backdrop-blur-xl border-b"
      style={{
        background: "rgba(8,8,16,0.85)",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      <div className="w-full px-3 py-3 flex items-center gap-2">
        {/* Logo */}
        <div
          className="flex items-center gap-2 flex-shrink-0 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img
            src="/favicon.png"
            alt="RimRantz"
            className="w-8 h-8 rounded-lg flex-shrink-0"
          />
          <span
            className="font-black text-lg tracking-tight hidden md:block"
            style={{
              background: "linear-gradient(90deg, #f97316, #ef4444)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            imRantz
          </span>
        </div>

        {/* Search bar */}
        <div className="flex-1 relative min-w-0" ref={searchRef}>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span className="text-zinc-500 text-sm flex-shrink-0">🔍</span>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => search && setShowResults(true)}
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-zinc-600 min-w-0"
            />
            {searching && (
              <span className="text-zinc-600 text-xs flex-shrink-0">...</span>
            )}
          </div>

          {showResults && (
            <div
              className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50"
              style={{
                background: "linear-gradient(135deg, #0f0f1a 0%, #151525 100%)",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
              }}
            >
              {results.length === 0 && (
                <div className="px-4 py-5 text-center">
                  <p className="text-zinc-500 text-sm">
                    No users found for "{search}"
                  </p>
                </div>
              )}
              {results.map((u) => (
                <div
                  key={u.username}
                  onClick={() => handleSelect(u)}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer transition hover:bg-white/5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-sm font-black overflow-hidden flex-shrink-0">
                    {u.avatar_url ? (
                      <img
                        src={u.avatar_url}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      u.username?.[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">
                      @{u.username}
                    </p>
                    <p className="text-zinc-500 text-xs">
                      💰 {(u.nba_bucks ?? 500).toLocaleString()}
                    </p>
                  </div>
                  {u.favorite_team && (
                    <img
                      src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/${u.favorite_team.toLowerCase()}.png`}
                      alt={u.favorite_team}
                      className="w-6 h-6 flex-shrink-0"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Bucks dropdown */}
          <div className="relative flex-shrink-0" ref={bucksRef}>
            <div
              onClick={() => setShowBucksMenu((v) => !v)}
              className="flex items-center gap-1 px-2 py-2 rounded-xl text-sm flex-shrink-0 cursor-pointer hover:opacity-80 transition"
              style={{
                background: showBucksMenu
                  ? "rgba(249,115,22,0.15)"
                  : "rgba(255,255,255,0.05)",
                border: showBucksMenu
                  ? "1px solid rgba(249,115,22,0.3)"
                  : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span>💰</span>
              <span className="text-white font-bold text-xs">
                {userBucks?.toLocaleString()}
              </span>
            </div>

            {showBucksMenu && (
              <div
                className="absolute top-full right-0 mt-2 w-48 rounded-2xl overflow-hidden z-50"
                style={{
                  background:
                    "linear-gradient(135deg, #0f0f1a 0%, #151525 100%)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
                }}
              >
                <div
                  className="px-4 py-3"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <p className="text-zinc-500 text-xs mb-1">Your balance</p>
                  <p className="text-white font-bold text-sm">
                    💰 {userBucks?.toLocaleString()} NBA Bucks
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowBucksMenu(false);
                    onBucksClick();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition cursor-pointer"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <span>📋</span>
                  <span>Transactions</span>
                </button>

                <button
                  onClick={() => {
                    setShowBucksMenu(false);
                    onShopClick?.();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm transition cursor-pointer"
                  style={{ color: "#f97316" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(249,115,22,0.08)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <span>🛍️</span>
                  <span className="font-semibold">Shop</span>
                </button>
              </div>
            )}
          </div>

          {/* Messages */}
          <button
            onClick={onMessagesClick}
            className="p-2 rounded-xl text-sm transition cursor-pointer flex-shrink-0 relative"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#71717a",
            }}
          >
            💬
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
                style={{ background: "#ef4444", fontSize: "9px" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Profile dropdown */}
          <div className="relative flex-shrink-0" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu((v) => !v)}
              className="flex items-center gap-1.5 px-2 py-2 rounded-xl text-sm font-medium transition cursor-pointer"
              style={{
                background: showProfileMenu
                  ? "rgba(249,115,22,0.2)"
                  : "rgba(249,115,22,0.1)",
                border: "1px solid rgba(249,115,22,0.2)",
                color: "#f97316",
              }}
            >
              <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold text-white overflow-hidden flex-shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  username?.[0]?.toUpperCase()
                )}
              </div>
              <span className="hidden md:inline text-xs">@{username}</span>
            </button>

            {showProfileMenu && (
              <div
                className="absolute top-full right-0 mt-2 w-44 rounded-2xl overflow-hidden z-50"
                style={{
                  background:
                    "linear-gradient(135deg, #0f0f1a 0%, #151525 100%)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
                }}
              >
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onProfileClick();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition cursor-pointer"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <span>👤</span>
                  <span>View Profile</span>
                </button>
                {isModerator && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onModPanelClick();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm transition cursor-pointer"
                    style={{
                      color: "#f97316",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(249,115,22,0.1)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <span>🛡️</span>
                    <span>Moderator Panel</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                >
                  <span>🚪</span>
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
