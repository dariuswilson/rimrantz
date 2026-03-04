import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";

export default function Navbar({
  username,
  avatarUrl,
  userBucks,
  onProfileClick,
  onLogout,
  onViewProfile,
  onMessagesClick,
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
        setSearch("");
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
    if (onViewProfile) onViewProfile(u.username);
  };

  return (
    <div
      className="sticky top-0 z-50 backdrop-blur-xl border-b"
      style={{
        background: "rgba(8,8,16,0.85)",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      <div className="max-w-2xl mx-auto px-6 py-3 flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
            style={{ background: "linear-gradient(135deg, #f97316, #ef4444)" }}
          >
            🏀
          </div>
          <span
            className="font-black text-lg tracking-tight hidden sm:block"
            style={{
              background: "linear-gradient(90deg, #f97316, #ef4444)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            HotTakes
          </span>
        </div>

        {/* Search bar */}
        <div className="flex-1 relative" ref={searchRef}>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"return (
  <div
    className="sticky top-0 z-50 backdrop-blur-xl border-b"
    style={{
      background: "rgba(8,8,16,0.85)",
      borderColor: "rgba(255,255,255,0.06)",
    }}
  >
    <div className="max-w-5xl mx-auto px-3 py-3 flex items-center gap-2">
      {/* Logo */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: "linear-gradient(135deg, #f97316, #ef4444)" }}
        >
          🏀
        </div>
        <span
          className="font-black text-lg tracking-tight hidden sm:block"
          style={{
            background: "linear-gradient(90deg, #f97316, #ef4444)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          HotTakes
        </span>
      </div>

      {/* Search bar */}
      <div className="flex-1 relative" ref={searchRef}>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <span className="text-zinc-500 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => search && setShowResults(true)}
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-zinc-600 min-w-0"
          />
          {searching && <span className="text-zinc-600 text-xs flex-shrink-0">...</span>}
        </div>

        {/* Dropdown results */}
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
                <p className="text-zinc-500 text-sm">No users found for "{search}"</p>
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
                    <img src={u.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    u.username?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">@{u.username}</p>
                  <p className="text-zinc-500 text-xs">💰 {(u.nba_bucks ?? 500).toLocaleString()}</p>
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

      {/* Right side - compact on mobile */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Bucks - hide label on mobile */}
        <div
          className="flex items-center gap-1 px-2 py-2 rounded-xl text-sm"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <span>💰</span>
          <span className="text-white font-bold text-xs">
            {userBucks?.toLocaleString()}
          </span>
        </div>

        {/* Messages */}
        <button
          onClick={onMessagesClick}
          className="p-2 rounded-xl text-sm transition cursor-pointer"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#71717a",
          }}
        >
          💬
        </button>

        {/* Profile button - just avatar on mobile */}
        <button
          onClick={onProfileClick}
          className="flex items-center gap-1.5 px-2 py-2 rounded-xl text-sm font-medium transition cursor-pointer"
          style={{
            background: "rgba(249,115,22,0.1)",
            border: "1px solid rgba(249,115,22,0.2)",
            color: "#f97316",
          }}
        >
          <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold text-white overflow-hidden flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              username?.[0]?.toUpperCase()
            )}
          </div>
          <span className="hidden sm:inline text-xs">@{username}</span>
        </button>

        {/* Sign out - hidden on mobile */}
        <button
          onClick={onLogout}
          className="hidden sm:block px-3 py-2 rounded-xl text-sm transition cursor-pointer"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#71717a",
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  </div>
);
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span className="text-zinc-500 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => search && setShowResults(true)}
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-zinc-600"
            />
            {searching && <span className="text-zinc-600 text-xs">...</span>}
          </div>

          {/* Dropdown results */}
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
                    <p className="text-white text-sm font-semibold">
                      @{u.username}
                    </p>
                    <p className="text-zinc-500 text-xs">
                      💰 {(u.nba_bucks ?? 500).toLocaleString()} NBA Bucks
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
        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span>💰</span>
            <span className="text-white font-bold">
              {userBucks?.toLocaleString()}
            </span>
            <span className="text-zinc-500 text-xs hidden sm:inline">
              NBA Bucks
            </span>
          </div>
          <button
            onClick={onMessagesClick}
            className="px-3 py-2 rounded-xl text-sm transition cursor-pointer relative"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#71717a",
            }}
          >
            💬
          </button>
          <button
            onClick={onProfileClick}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition cursor-pointer"
            style={{
              background: "rgba(249,115,22,0.1)",
              border: "1px solid rgba(249,115,22,0.2)",
              color: "#f97316",
            }}
          >
            <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
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
            <span className="hidden sm:inline">@{username}</span>
          </button>
          <button
            onClick={onLogout}
            className="px-3 py-2 rounded-xl text-sm transition cursor-pointer"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#71717a",
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
