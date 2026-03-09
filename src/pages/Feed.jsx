import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { moderateContent } from "../utils/moderate";
import GamesBar from "../components/GamesBar";
import Navbar from "../components/Navbar";
import Leaderboard from "../components/Leaderboard";
import ReportModal from "./ReportModal";

const EMOJIS = ["🔥", "💀", "🐐", "😂", "👀"];

export default function Feed({
  username,
  user,
  onProfileClick,
  onViewProfile,
  onGameClick,
  userBucks,
  onBucksUpdate,
  onMessagesClick,
  onBucksClick,
  unreadCount,
  isModerator,
  onModPanelClick,
  onShopClick,
}) {
  const [takes, setTakes] = useState([]);
  const [newTake, setNewTake] = useState("");
  const [loading, setLoading] = useState(false);
  const [reactions, setReactions] = useState({});
  const [comments, setComments] = useState({});
  const [openComments, setOpenComments] = useState(null);
  const [newComment, setNewComment] = useState({});
  const [error, setError] = useState("");
  const [moderatorIds, setModeratorIds] = useState(new Set());
  const [visibleTakes, setVisibleTakes] = useState(10);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [reportModal, setReportModal] = useState(null);

  const fetchModerators = async () => {
    const { data } = await supabase.from("moderators").select("user_id");
    setModeratorIds(new Set(data?.map((m) => m.user_id) || []));
  };

  const fetchTakes = async () => {
    const { data } = await supabase
      .from("takes")
      .select("*, profiles(avatar_url, is_shadowbanned)")
      .order("created_at", { ascending: false });
    setTakes(data || []);
  };

  const fetchReactions = async () => {
    const { data } = await supabase.from("reactions").select("*");
    const grouped = {};
    data?.forEach((r) => {
      if (!grouped[r.take_id]) grouped[r.take_id] = {};
      if (!grouped[r.take_id][r.emoji]) grouped[r.take_id][r.emoji] = [];
      grouped[r.take_id][r.emoji].push(r.user_id);
    });
    setReactions(grouped);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*, profiles(avatar_url, is_shadowbanned)")
      .order("created_at", { ascending: true });
    const grouped = {};
    data?.forEach((c) => {
      if (c.profiles?.is_shadowbanned && c.user_id !== user?.id) return;
      if (!grouped[c.take_id]) grouped[c.take_id] = [];
      grouped[c.take_id].push(c);
    });
    setComments(grouped);
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchTakes();
      await fetchReactions();
      await fetchComments();
      await fetchModerators();

      const { data: profileData } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", user.id)
        .single();
      setAvatarUrl(profileData?.avatar_url || null);
    };
    loadData();

    const channel = supabase
      .channel("realtime-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "takes" },
        () => fetchTakes(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reactions" },
        () => fetchReactions(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments" },
        () => fetchComments(),
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const postTake = async () => {
    if (!newTake.trim()) return;
    setLoading(true);
    setError("");
    const allowed = await moderateContent(newTake);
    if (!allowed) {
      setError("Your take contains inappropriate content. Please revise it.");
      setLoading(false);
      return;
    }
    await supabase
      .from("takes")
      .insert({ content: newTake, user_id: user.id, username });
    setNewTake("");
    await fetchTakes();
    setLoading(false);
  };

  const handleReaction = async (takeId, emoji) => {
    const existing = reactions[takeId]?.[emoji]?.includes(user.id);
    if (existing) {
      await supabase
        .from("reactions")
        .delete()
        .eq("take_id", takeId)
        .eq("user_id", user.id)
        .eq("emoji", emoji);
    } else {
      await supabase
        .from("reactions")
        .insert({ take_id: takeId, user_id: user.id, emoji });
    }
    await fetchReactions();
  };

  const deleteComment = async (commentId) => {
    await supabase.from("comments").delete().eq("id", commentId);
    await fetchComments();
  };

  const deleteTake = async (takeId) => {
    await supabase.from("takes").delete().eq("id", takeId);
    await fetchTakes();
  };

  const postComment = async (takeId) => {
    const content = newComment[takeId]?.trim();
    if (!content) return;
    try {
      const allowed = await moderateContent(content);
      if (!allowed) {
        setError("Your comment contains inappropriate content.");
        return;
      }
    } catch {
      /* continue */
    }
    await supabase
      .from("comments")
      .insert({ take_id: takeId, user_id: user.id, username, content });
    setNewComment((prev) => ({ ...prev, [takeId]: "" }));
    await fetchComments();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const filteredTakes = takes.filter(
    (take) => !take.profiles?.is_shadowbanned || take.user_id === user?.id,
  );

  return (
    <div className="min-h-screen text-white" style={{ background: "#080810" }}>
      {/* Report Modal */}
      {reportModal && (
        <ReportModal
          reporter={user}
          reporterUsername={username}
          reportedUserId={reportModal.reportedUserId}
          reportedUsername={reportModal.reportedUsername}
          contentType={reportModal.contentType}
          contentId={reportModal.contentId}
          contentPreview={reportModal.contentPreview}
          onClose={() => setReportModal(null)}
        />
      )}

      {/* Top navbar */}
      <Navbar
        username={username}
        avatarUrl={avatarUrl}
        userBucks={userBucks}
        onProfileClick={onProfileClick}
        onLogout={handleLogout}
        onViewProfile={onViewProfile}
        onMessagesClick={onMessagesClick}
        onBucksClick={onBucksClick}
        unreadCount={unreadCount}
        isModerator={isModerator}
        onModPanelClick={onModPanelClick}
        onShopClick={onShopClick}
      />
      <div className="max-w-5xl mx-auto px-6 py-6 flex gap-6">
        <div className="w-72 flex-shrink-0 hidden lg:block">
          <Leaderboard onViewProfile={onViewProfile} />
        </div>
        <div className="flex-1 min-w-0">
          {/* Games bar */}
          <GamesBar
            onGameClick={onGameClick}
            user={user}
            userBucks={userBucks}
            onBucksUpdate={onBucksUpdate}
          />

          {/* Mobile leaderboard - shows below games bar */}
          <div className="lg:hidden mb-6">
            <Leaderboard onViewProfile={onViewProfile} />
          </div>

          {/* Compose box */}
          <div
            className="rounded-2xl p-5 mb-6"
            style={{
              background: "linear-gradient(135deg, #0f0f1a 0%, #151525 100%)",
              border: "1px solid rgba(249,115,22,0.15)",
            }}
          >
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-sm font-black flex-shrink-0 overflow-hidden">
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
              <div className="flex-1">
                {error && (
                  <div
                    className="mb-3 px-3 py-2 rounded-lg text-xs text-red-400"
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.2)",
                    }}
                  >
                    {error}
                  </div>
                )}
                <textarea
                  value={newTake}
                  onChange={(e) => setNewTake(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && e.metaKey && postTake()
                  }
                  placeholder="Drop your NBA hot take... 🔥"
                  className="w-full bg-transparent text-white placeholder-zinc-600 resize-none outline-none text-sm leading-relaxed"
                  rows={3}
                />
                <div
                  className="flex items-center justify-between mt-3 pt-3"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <span className="text-zinc-700 text-xs">
                    {newTake.length > 0
                      ? `${newTake.length} chars`
                      : "⌘ + Enter to post"}
                  </span>
                  <button
                    onClick={postTake}
                    disabled={loading || !newTake.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer disabled:opacity-40"
                    style={{
                      background: "linear-gradient(135deg, #f97316, #ef4444)",
                      color: "white",
                    }}
                  >
                    {loading ? "Posting..." : "Post 🔥"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Feed */}
          <div className="space-y-3">
            {filteredTakes.length === 0 && (
              <div className="text-center py-16">
                <p className="text-5xl mb-4">🏀</p>
                <p className="text-zinc-500">No takes yet. Be the first!</p>
              </div>
            )}

            {filteredTakes.slice(0, visibleTakes).map((take, i) => (
              <div
                key={take.id}
                className="rounded-2xl p-5 transition group"
                style={{
                  background:
                    "linear-gradient(135deg, #0d0d1a 0%, #121220 100%)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  animationDelay: `${i * 30}ms`,
                }}
              >
                {/* Post header */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    onClick={() => onViewProfile(take.username)}
                    className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-sm font-black overflow-hidden flex-shrink-0 cursor-pointer ring-2 ring-transparent hover:ring-orange-500 transition"
                  >
                    {take.profiles?.avatar_url ? (
                      <img
                        src={take.profiles.avatar_url}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      take.username?.[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        onClick={() => onViewProfile(take.username)}
                        className="text-sm font-semibold text-white cursor-pointer hover:text-orange-400 transition truncate"
                      >
                        @{take.username}
                      </span>
                      {moderatorIds.has(take.user_id) && (
                        <span title="Moderator" className="text-xs">
                          🛡️
                        </span>
                      )}
                    </div>
                    <span className="text-zinc-600 text-xs">
                      {new Date(take.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {/* Delete own post OR report others' post */}
                  {take.user_id === user?.id ? (
                    <button
                      onClick={() => deleteTake(take.id)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-400 text-xs transition cursor-pointer px-2 py-1 rounded-lg hover:bg-red-500/10"
                    >
                      ✕
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        setReportModal({
                          reportedUserId: take.user_id,
                          reportedUsername: take.username,
                          contentType: "post",
                          contentId: take.id,
                          contentPreview: take.content,
                        })
                      }
                      className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-400 text-xs transition cursor-pointer px-2 py-1 rounded-lg hover:bg-red-500/10"
                      title="Report post"
                    >
                      🚩
                    </button>
                  )}
                </div>

                {/* Content */}
                <p
                  className="text-white text-sm leading-relaxed mb-4"
                  style={{ lineHeight: "1.6" }}
                >
                  {take.content}
                </p>

                {/* Reactions */}
                <div className="flex items-center gap-1.5 flex-wrap mb-3">
                  {EMOJIS.map((emoji) => {
                    const count = reactions[take.id]?.[emoji]?.length || 0;
                    const reacted = reactions[take.id]?.[emoji]?.includes(
                      user?.id,
                    );
                    return (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(take.id, emoji)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition cursor-pointer"
                        style={{
                          background: reacted
                            ? "rgba(249,115,22,0.2)"
                            : "rgba(255,255,255,0.04)",
                          border: reacted
                            ? "1px solid rgba(249,115,22,0.4)"
                            : "1px solid rgba(255,255,255,0.06)",
                          color: reacted ? "#f97316" : "#71717a",
                        }}
                      >
                        {emoji}{" "}
                        {count > 0 && (
                          <span className="font-medium">{count}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Comments toggle */}
                <button
                  onClick={() =>
                    setOpenComments(openComments === take.id ? null : take.id)
                  }
                  className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-300 text-xs transition cursor-pointer"
                >
                  <span>💬</span>
                  <span>
                    {comments[take.id]?.length || 0}{" "}
                    {comments[take.id]?.length === 1 ? "comment" : "comments"}
                  </span>
                </button>

                {/* Comments section */}
                {openComments === take.id && (
                  <div
                    className="mt-4 space-y-3"
                    style={{
                      borderTop: "1px solid rgba(255,255,255,0.05)",
                      paddingTop: "1rem",
                    }}
                  >
                    {comments[take.id]?.map((c) => (
                      <div
                        key={c.id}
                        className="flex gap-2.5 items-start group/comment"
                      >
                        <div
                          onClick={() => onViewProfile(c.username)}
                          className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-xs font-black flex-shrink-0 overflow-hidden cursor-pointer"
                        >
                          {c.profiles?.avatar_url ? (
                            <img
                              src={c.profiles.avatar_url}
                              alt="avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            c.username?.[0]?.toUpperCase()
                          )}
                        </div>
                        <div
                          className="flex-1 min-w-0 rounded-xl px-3 py-2"
                          style={{ background: "rgba(255,255,255,0.04)" }}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span
                              onClick={() => onViewProfile(c.username)}
                              className="text-xs font-semibold text-zinc-300 cursor-pointer hover:text-orange-400 transition"
                            >
                              @{c.username}
                            </span>
                            {moderatorIds.has(c.user_id) && (
                              <span className="text-xs">🛡️</span>
                            )}
                          </div>
                          <span className="text-white text-xs leading-relaxed">
                            {c.content}
                          </span>
                        </div>
                        {/* Delete own comment OR report others' comment */}
                        {c.user_id === user?.id ? (
                          <button
                            onClick={() => deleteComment(c.id)}
                            className="opacity-0 group-hover/comment:opacity-100 text-zinc-700 hover:text-red-400 text-xs transition cursor-pointer mt-1"
                          >
                            ✕
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setReportModal({
                                reportedUserId: c.user_id,
                                reportedUsername: c.username,
                                contentType: "comment",
                                contentId: c.id,
                                contentPreview: c.content,
                              })
                            }
                            className="opacity-0 group-hover/comment:opacity-100 text-zinc-700 hover:text-red-400 text-xs transition cursor-pointer mt-1"
                            title="Report comment"
                          >
                            🚩
                          </button>
                        )}
                      </div>
                    ))}

                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={newComment[take.id] || ""}
                        onChange={(e) =>
                          setNewComment((prev) => ({
                            ...prev,
                            [take.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" && postComment(take.id)
                        }
                        placeholder="Add a comment..."
                        className="flex-1 text-white text-xs px-3 py-2 rounded-xl outline-none transition"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      />
                      <button
                        onClick={() => postComment(take.id)}
                        className="px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                        style={{
                          background:
                            "linear-gradient(135deg, #f97316, #ef4444)",
                          color: "white",
                        }}
                      >
                        Post
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {filteredTakes.length > visibleTakes && (
              <button
                onClick={() => setVisibleTakes((v) => v + 10)}
                className="w-full py-3 rounded-xl text-sm font-medium transition cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#71717a",
                }}
              >
                Load more ({filteredTakes.length - visibleTakes} remaining)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
