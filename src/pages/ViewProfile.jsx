import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import TransactionsModal from "./TransactionsModal";
import Navbar from "../components/Navbar";
import ReportModal from "./ReportModal";

const NBA_TEAMS = [
  { name: "Atlanta Hawks", abbr: "ATL" },
  { name: "Boston Celtics", abbr: "BOS" },
  { name: "Brooklyn Nets", abbr: "BKN" },
  { name: "Charlotte Hornets", abbr: "CHA" },
  { name: "Chicago Bulls", abbr: "CHI" },
  { name: "Cleveland Cavaliers", abbr: "CLE" },
  { name: "Dallas Mavericks", abbr: "DAL" },
  { name: "Denver Nuggets", abbr: "DEN" },
  { name: "Detroit Pistons", abbr: "DET" },
  { name: "Golden State Warriors", abbr: "GSW" },
  { name: "Houston Rockets", abbr: "HOU" },
  { name: "Indiana Pacers", abbr: "IND" },
  { name: "LA Clippers", abbr: "LAC" },
  { name: "Los Angeles Lakers", abbr: "LAL" },
  { name: "Memphis Grizzlies", abbr: "MEM" },
  { name: "Miami Heat", abbr: "MIA" },
  { name: "Milwaukee Bucks", abbr: "MIL" },
  { name: "Minnesota Timberwolves", abbr: "MIN" },
  { name: "New Orleans Pelicans", abbr: "NOP" },
  { name: "New York Knicks", abbr: "NYK" },
  { name: "Oklahoma City Thunder", abbr: "OKC" },
  { name: "Orlando Magic", abbr: "ORL" },
  { name: "Philadelphia 76ers", abbr: "PHI" },
  { name: "Phoenix Suns", abbr: "PHX" },
  { name: "Portland Trail Blazers", abbr: "POR" },
  { name: "Sacramento Kings", abbr: "SAC" },
  { name: "San Antonio Spurs", abbr: "SAS" },
  { name: "Toronto Raptors", abbr: "TOR" },
  { name: "Utah Jazz", abbr: "UTA" },
  { name: "Washington Wizards", abbr: "WAS" },
];

const POSTS_PER_PAGE = 10;

export default function ViewProfile({
  username,
  currentUser,
  currentUsername,
  isModerator,
  onBack,
  onDM,
  ...props
}) {
  const [profile, setProfile] = useState(null);
  const [takes, setTakes] = useState([]);
  const [comments, setComments] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [visiblePosts, setVisiblePosts] = useState(POSTS_PER_PAGE);
  const [visibleComments, setVisibleComments] = useState(POSTS_PER_PAGE);
  const [strikeCount, setStrikeCount] = useState(0);
  const [issuingStrike, setIssuingStrike] = useState(false);
  const [isShadowbanned, setIsShadowbanned] = useState(false);
  const [isProfileMod, setIsProfileMod] = useState(false);
  const [gameTakes, setGameTakes] = useState([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(null);
  const [reportModal, setReportModal] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      setProfile(profileData);
      setStrikeCount(profileData?.strike_count || 0);
      setIsShadowbanned(profileData?.is_shadowbanned || false);

      const { data: modCheck } = await supabase
        .from("moderators")
        .select("user_id")
        .eq("user_id", profileData.user_id)
        .maybeSingle();
      setIsProfileMod(!!modCheck);

      if (profileData) {
        const { data: takesData } = await supabase
          .from("takes")
          .select("*")
          .eq("user_id", profileData.user_id)
          .order("created_at", { ascending: false });
        setTakes(takesData || []);

        const { data: commentsData } = await supabase
          .from("comments")
          .select("*, takes(content)")
          .eq("user_id", profileData.user_id)
          .order("created_at", { ascending: false });
        setComments(commentsData || []);

        const { data: badgeData } = await supabase
          .from("user_badges")
          .select("*")
          .eq("user_id", profileData.user_id);
        setBadges(badgeData || []);
      }

      const { data: gameData } = await supabase
        .from("game_takes")
        .select("*")
        .eq("user_id", profileData.user_id)
        .order("created_at", { ascending: false });
      setGameTakes(gameData || []);

      setLoading(false);
    };
    loadData();
  }, [username]);

  useEffect(() => {
    const fetchCurrentAvatar = async () => {
      if (!currentUser) return;
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", currentUser.id)
        .single();
      setCurrentAvatarUrl(data?.avatar_url || null);
    };
    fetchCurrentAvatar();
  }, [currentUser]);

  const issueStrike = async () => {
    if (!profile) return;
    setIssuingStrike(true);
    const newCount = strikeCount + 1;
    const shouldBan = newCount >= 3;
    await supabase
      .from("profiles")
      .update({ strike_count: newCount, is_shadowbanned: shouldBan })
      .eq("user_id", profile.user_id);
    setStrikeCount(newCount);
    setIsShadowbanned(shouldBan);
    setIssuingStrike(false);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-orange-500 text-xl">🏀 Loading...</p>
      </div>
    );

  const visibleTakes = takes.slice(0, visiblePosts);
  const visibleCommentsList = comments.slice(0, visibleComments);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Report Modal */}
      {reportModal && (
        <ReportModal
          reporter={currentUser}
          reporterUsername={currentUsername}
          reportedUserId={reportModal.reportedUserId}
          reportedUsername={reportModal.reportedUsername}
          contentType={reportModal.contentType}
          contentId={reportModal.contentId}
          contentPreview={reportModal.contentPreview}
          onClose={() => setReportModal(null)}
        />
      )}

      <Navbar
        {...props}
        avatarUrl={currentAvatarUrl}
        username={currentUsername}
        isModerator={isModerator}
      />
      <div className="max-w-2xl mx-auto p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition cursor-pointer mb-6"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#71717a",
          }}
        >
          ← Back
        </button>

        {/* Profile card */}
        <div
          className="rounded-2xl overflow-hidden mb-6"
          style={{
            background: "linear-gradient(135deg, #1c1c1e 0%, #2a2a2e 100%)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            className="h-24 w-full"
            style={{
              background:
                "linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)",
            }}
          />

          <div className="p-6 pt-0">
            <div className="flex items-end justify-between -mt-10 mb-4">
              <div className="w-20 h-20 rounded-full border-4 border-zinc-950 bg-orange-500 flex items-center justify-center text-2xl font-bold overflow-hidden">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  username?.[0]?.toUpperCase()
                )}
              </div>
              {/* Message + Report buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    onDM({
                      user_id: profile.user_id,
                      username,
                      avatar_url: profile.avatar_url,
                    })
                  }
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer"
                  style={{
                    background: "rgba(249,115,22,0.1)",
                    border: "1px solid rgba(249,115,22,0.2)",
                    color: "#f97316",
                  }}
                >
                  💬 Message
                </button>
                <button
                  onClick={() =>
                    setReportModal({
                      reportedUserId: profile.user_id,
                      reportedUsername: username,
                      contentType: "profile",
                      contentId: profile.user_id,
                      contentPreview: profile.bio || "",
                    })
                  }
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition cursor-pointer"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.15)",
                    color: "#71717a",
                  }}
                  title="Report profile"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#ef4444";
                    e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#71717a";
                    e.currentTarget.style.borderColor = "rgba(239,68,68,0.15)";
                  }}
                >
                  🚩
                </button>
              </div>
            </div>

            <div className="mb-3">
              <h2 className="text-xl font-bold flex items-center gap-2">
                @{username}
                {isProfileMod && <span title="Moderator">🛡️</span>}
                {isShadowbanned && isModerator && (
                  <span className="text-xs text-red-400 font-normal">
                    shadowbanned
                  </span>
                )}
              </h2>
              {profile?.favorite_team && (
                <div className="flex items-center gap-2 mt-1">
                  <img
                    src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/${profile.favorite_team.toLowerCase()}.png`}
                    alt={profile.favorite_team}
                    className="w-5 h-5"
                    onError={(e) => (e.target.style.display = "none")}
                  />
                  <span className="text-zinc-400 text-sm">
                    {
                      NBA_TEAMS.find((t) => t.abbr === profile.favorite_team)
                        ?.name
                    }
                  </span>
                </div>
              )}
            </div>

            <p className="text-zinc-400 text-sm leading-relaxed">
              {profile?.bio || "No bio yet."}
            </p>

            <div className="flex gap-6 mt-4 pt-4 border-t border-white/5">
              <div className="text-center">
                <p className="text-lg font-bold text-white">{takes.length}</p>
                <p className="text-xs text-zinc-500">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white">
                  {comments.length}
                </p>
                <p className="text-xs text-zinc-500">Comments</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white">{badges.length}</p>
                <p className="text-xs text-zinc-500">Badges</p>
              </div>
              <div
                className="text-center cursor-pointer group"
                onClick={() => setShowTransactions(true)}
              >
                <p className="text-lg font-bold text-white group-hover:text-orange-400 transition">
                  💰{(profile?.nba_bucks ?? 0).toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500 group-hover:text-orange-400 transition">
                  NBA Bucks
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mod Panel - strike controls */}
        {isModerator && currentUser?.id !== profile?.user_id && (
          <div
            className="rounded-2xl p-5 mb-6"
            style={{
              background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
              border: "1px solid rgba(99,102,241,0.3)",
            }}
          >
            <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-4">
              🛡️ Moderator Panel
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex gap-1">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      background:
                        n <= strikeCount ? "#ef4444" : "rgba(255,255,255,0.1)",
                    }}
                  >
                    {n <= strikeCount ? "✕" : n}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-white text-sm font-medium">
                  {strikeCount}/3 strikes
                </p>
                {isShadowbanned && (
                  <p className="text-red-400 text-xs">
                    ⚠️ User is shadowbanned
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={issueStrike}
                disabled={issuingStrike || strikeCount >= 3}
                className="flex-1 py-2 rounded-xl text-sm font-medium transition disabled:opacity-40"
                style={{
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#ef4444",
                }}
              >
                {issuingStrike ? "Issuing..." : "⚠️ Issue Ban Strike"}
              </button>
              {isShadowbanned && (
                <button
                  onClick={async () => {
                    await supabase
                      .from("profiles")
                      .update({ strike_count: 0, is_shadowbanned: false })
                      .eq("user_id", profile.user_id);
                    setStrikeCount(0);
                    setIsShadowbanned(false);
                  }}
                  className="flex-1 py-2 rounded-xl text-sm font-medium transition"
                  style={{
                    background: "rgba(34,197,94,0.15)",
                    border: "1px solid rgba(34,197,94,0.3)",
                    color: "#22c55e",
                  }}
                >
                  ✓ Remove Shadowban
                </button>
              )}
            </div>
          </div>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <div
            className="rounded-2xl p-5 mb-6"
            style={{
              background: "linear-gradient(135deg, #1c1c1e 0%, #2a2a2e 100%)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              🏅 Badges
            </h3>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-full"
                  style={{
                    background: "linear-gradient(135deg, #f59e0b, #f97316)",
                  }}
                >
                  <div
                    title={
                      badge.badge_key === "first_30"
                        ? "One of the first 30 members to join RimRantz!"
                        : ""
                    }
                  >
                    <span className="text-sm">⭐</span>
                    <span className="text-black font-bold text-xs">
                      {badge.badge_key === "first_30"
                        ? "Founding Member"
                        : badge.badge_key}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div
          className="flex gap-1 p-1 rounded-xl mb-6"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          {["posts", "comments", "game"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition"
              style={{
                background: activeTab === tab ? "#f97316" : "transparent",
                color: activeTab === tab ? "white" : "#71717a",
              }}
            >
              {tab === "posts"
                ? `Posts (${takes.length})`
                : tab === "comments"
                  ? `Comments (${comments.length})`
                  : `Game Posts (${gameTakes.length})`}
            </button>
          ))}
        </div>

        {/* Posts tab */}
        {activeTab === "posts" && (
          <div className="space-y-3">
            {takes.length === 0 && (
              <div className="text-center py-12 text-zinc-600">
                <p className="text-4xl mb-3">🏀</p>
                <p>No posts yet!</p>
              </div>
            )}
            {visibleTakes.map((take) => (
              <div
                key={take.id}
                className="rounded-2xl p-4"
                style={{
                  background:
                    "linear-gradient(135deg, #1c1c1e 0%, #2a2a2e 100%)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p className="text-white text-sm leading-relaxed">
                  {take.content}
                </p>
                <p className="text-zinc-600 text-xs mt-3">
                  {new Date(take.created_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
            {takes.length > visiblePosts && (
              <button
                onClick={() => setVisiblePosts((v) => v + POSTS_PER_PAGE)}
                className="w-full py-3 rounded-xl text-sm text-zinc-400 hover:text-white transition"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                Show more posts ({takes.length - visiblePosts} remaining)
              </button>
            )}
          </div>
        )}

        {/* Comments tab */}
        {activeTab === "comments" && (
          <div className="space-y-3">
            {comments.length === 0 && (
              <div className="text-center py-12 text-zinc-600">
                <p className="text-4xl mb-3">💬</p>
                <p>No comments yet!</p>
              </div>
            )}
            {visibleCommentsList.map((comment) => (
              <div
                key={comment.id}
                className="rounded-2xl p-4"
                style={{
                  background:
                    "linear-gradient(135deg, #1c1c1e 0%, #2a2a2e 100%)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {comment.takes?.content && (
                  <div className="text-xs text-zinc-500 mb-2 pb-2 border-b border-white/5">
                    💬 Replying to:{" "}
                    <span className="text-zinc-400 italic">
                      "{comment.takes.content.slice(0, 60)}
                      {comment.takes.content.length > 60 ? "..." : ""}"
                    </span>
                  </div>
                )}
                <p className="text-white text-sm leading-relaxed">
                  {comment.content}
                </p>
                <p className="text-zinc-600 text-xs mt-3">
                  {new Date(comment.created_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
            {comments.length > visibleComments && (
              <button
                onClick={() => setVisibleComments((v) => v + POSTS_PER_PAGE)}
                className="w-full py-3 rounded-xl text-sm text-zinc-400 hover:text-white transition"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                Show more comments ({comments.length - visibleComments}{" "}
                remaining)
              </button>
            )}
          </div>
        )}

        {activeTab === "game" && (
          <div className="space-y-3">
            {gameTakes.length === 0 && (
              <div className="text-center py-12 text-zinc-600">
                <p className="text-4xl mb-3">🏀</p>
                <p>No game posts yet!</p>
              </div>
            )}
            {gameTakes.map((take) => (
              <div
                key={take.id}
                className="rounded-2xl p-4"
                style={{
                  background:
                    "linear-gradient(135deg, #1c1c1e 0%, #2a2a2e 100%)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p className="text-xs text-zinc-500 mb-2">🏀 Game post</p>
                <p className="text-white text-sm leading-relaxed">
                  {take.content}
                </p>
                <p className="text-zinc-600 text-xs mt-3">
                  {new Date(take.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}

        {showTransactions && (
          <TransactionsModal
            userId={profile?.user_id}
            username={username}
            onClose={() => setShowTransactions(false)}
            onBucksUpdate={(newBalance) =>
              setProfile((prev) => ({ ...prev, nba_bucks: newBalance }))
            }
          />
        )}
      </div>
    </div>
  );
}
