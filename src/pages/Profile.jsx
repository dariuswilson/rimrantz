import { useState, useEffect } from "react";
import { supabase } from "../supabase";

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

function ModeratorPanel() {
  const [shadowbanned, setShadowbanned] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchShadowbanned = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, username, strike_count, avatar_url")
      .eq("is_shadowbanned", true);
    setShadowbanned(data || []);
    setLoading(false);
  };

  useEffect(() => {
    const load = async () => {
      await fetchShadowbanned();
    };
    load();
  }, []);

  const unban = async (userId) => {
    await supabase
      .from("profiles")
      .update({ is_shadowbanned: false, strike_count: 0 })
      .eq("user_id", userId);
    fetchShadowbanned();
  };

  return (
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

      <p className="text-zinc-400 text-xs mb-4">Shadowbanned users</p>

      {loading && <p className="text-zinc-500 text-sm">Loading...</p>}

      {!loading && shadowbanned.length === 0 && (
        <p className="text-zinc-500 text-sm">No shadowbanned users 🎉</p>
      )}

      <div className="space-y-3">
        {shadowbanned.map((u) => (
          <div
            key={u.user_id}
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-sm font-bold overflow-hidden flex-shrink-0">
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
            <div className="flex-1">
              <p className="text-white text-sm font-medium">@{u.username}</p>
              <p className="text-red-400 text-xs">{u.strike_count}/3 strikes</p>
            </div>
            <button
              onClick={() => unban(u.user_id)}
              className="px-3 py-1 rounded-lg text-xs font-medium transition"
              style={{
                background: "rgba(34,197,94,0.15)",
                border: "1px solid rgba(34,197,94,0.3)",
                color: "#22c55e",
              }}
            >
              ✓ Unban
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Profile({ username, user, isModerator, onBack }) {
  const [profile, setProfile] = useState(null);
  const [takes, setTakes] = useState([]);
  const [comments, setComments] = useState([]);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [favoriteTeam, setFavoriteTeam] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [badges, setBadges] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [visiblePosts, setVisiblePosts] = useState(POSTS_PER_PAGE);
  const [visibleComments, setVisibleComments] = useState(POSTS_PER_PAGE);

  const fetchProfile = async () => {
    if (!user) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    setProfile(profileData);
    setBio(profileData?.bio || "");
    setFavoriteTeam(profileData?.favorite_team || "");

    const { data: badgeData } = await supabase
      .from("user_badges")
      .select("*")
      .eq("user_id", user.id);

    setBadges(badgeData || []);
  };

  const fetchTakes = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("takes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setTakes(data || []);
  };

  const fetchComments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("comments")
      .select("*, takes(content)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setComments(data || []);
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchProfile();
      await fetchTakes();
      await fetchComments();
    };
    loadData();
  }, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (!error) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("user_id", user.id);
      fetchProfile();
    }

    setUploading(false);
  };

  const saveProfile = async () => {
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ bio, favorite_team: favoriteTeam })
      .eq("user_id", user.id);
    await fetchProfile();
    setEditing(false);
    setSaving(false);
  };

  const visibleTakes = takes.slice(0, visiblePosts);
  const visibleCommentsList = comments.slice(0, visibleComments);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition text-sm"
          >
            ← Back
          </button>
        </div>

        {/* Profile card */}
        <div
          className="rounded-2xl overflow-hidden mb-6"
          style={{
            background: "linear-gradient(135deg, #1c1c1e 0%, #2a2a2e 100%)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {/* Banner */}
          <div
            className="h-24 w-full"
            style={{
              background:
                "linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)",
            }}
          />

          <div className="p-6 pt-0">
            {/* Avatar row */}
            <div className="flex items-end justify-between -mt-10 mb-4">
              <div className="relative">
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
                <label className="absolute bottom-0 right-0 bg-zinc-700 hover:bg-orange-500 rounded-full w-7 h-7 flex items-center justify-center cursor-pointer transition border-2 border-zinc-950">
                  <span className="text-xs">✎</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                onClick={() => setEditing(!editing)}
                className="px-4 py-2 rounded-full text-sm font-medium transition"
                style={{
                  background: editing
                    ? "rgba(249,115,22,0.2)"
                    : "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: editing ? "#f97316" : "white",
                }}
              >
                {editing ? "Cancel" : "Edit Profile"}
              </button>
            </div>

            {/* Name & team */}
            <div className="mb-3">
              <h2 className="text-xl font-bold flex items-center gap-2">
                @{username}
                {isModerator && <span title="Moderator">🛡️</span>}
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

            {/* Bio */}
            {!editing && (
              <p className="text-zinc-400 text-sm leading-relaxed">
                {profile?.bio || "No bio yet — click Edit Profile to add one!"}
              </p>
            )}

            {/* Stats row */}
            {!editing && (
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
                  <p className="text-lg font-bold text-white">
                    {badges.length}
                  </p>
                  <p className="text-xs text-zinc-500">Badges</p>
                </div>
              </div>
            )}

            {/* Edit form */}
            {editing && (
              <div className="space-y-3 mt-4">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write a bio..."
                  rows={3}
                  className="w-full text-white p-3 rounded-xl outline-none text-sm resize-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
                <select
                  value={favoriteTeam}
                  onChange={(e) => setFavoriteTeam(e.target.value)}
                  className="w-full text-white p-3 rounded-xl outline-none text-sm"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <option value="">Select your favorite team</option>
                  {NBA_TEAMS.map((team) => (
                    <option
                      key={team.abbr}
                      value={team.abbr}
                      style={{ background: "#1c1c1e" }}
                    >
                      {team.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            )}

            {uploading && (
              <p className="text-zinc-400 text-sm mt-2">Uploading picture...</p>
            )}
          </div>
        </div>

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
                  <span className="text-sm">🏆</span>
                  <span className="text-black font-bold text-xs">
                    {badge.badge_key === "first_100"
                      ? "First 100"
                      : badge.badge_key}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Moderator Panel - only visible to mods on their own profile */}
        {isModerator && <ModeratorPanel />}

        {/* Tabs */}
        <div
          className="flex gap-1 p-1 rounded-xl mb-6"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          <button
            onClick={() => setActiveTab("posts")}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition"
            style={{
              background: activeTab === "posts" ? "#f97316" : "transparent",
              color: activeTab === "posts" ? "white" : "#71717a",
            }}
          >
            Posts ({takes.length})
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition"
            style={{
              background: activeTab === "comments" ? "#f97316" : "transparent",
              color: activeTab === "comments" ? "white" : "#71717a",
            }}
          >
            Comments ({comments.length})
          </button>
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
                  {new Date(take.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
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
                  {new Date(comment.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
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
      </div>
    </div>
  );
}
