export default function Navbar({
  username,
  avatarUrl,
  userBucks,
  onProfileClick,
  onLogout,
}) {
  return (
    <div
      className="sticky top-0 z-50 backdrop-blur-xl border-b"
      style={{
        background: "rgba(8,8,16,0.85)",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
            style={{ background: "linear-gradient(135deg, #f97316, #ef4444)" }}
          >
            🏀
          </div>
          <div>
            <span
              className="font-black text-lg tracking-tight"
              style={{
                background: "linear-gradient(90deg, #f97316, #ef4444)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              HotTakes
            </span>
            <span className="text-zinc-600 text-xs ml-1 hidden sm:inline">
              NBA
            </span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
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
