import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { moderateContent } from "../utils/moderate";

const NBA_TEAM_COLORS = {
  ATL: "#C1272D",
  BOS: "#007A33",
  BKN: "#000000",
  CHA: "#1D1160",
  CHI: "#CE1141",
  CLE: "#860038",
  DAL: "#00538C",
  DEN: "#0E2240",
  DET: "#C8102E",
  GSW: "#1D428A",
  HOU: "#CE1141",
  IND: "#002D62",
  LAC: "#C8102E",
  LAL: "#552583",
  MEM: "#5D76A9",
  MIA: "#98002E",
  MIL: "#00471B",
  MIN: "#0C2340",
  NOP: "#0C2340",
  NYK: "#006BB6",
  OKC: "#007AC1",
  ORL: "#0077C0",
  PHI: "#006BB6",
  PHX: "#1D1160",
  POR: "#E03A3E",
  SAC: "#5A2D81",
  SAS: "#C4CED4",
  TOR: "#CE1141",
  UTA: "#002B5C",
  WAS: "#002B5C",
};

export default function GameFeed({
  game,
  user,
  username,
  onBack,
  onViewProfile,
}) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [moderatorIds, setModeratorIds] = useState(new Set());
  const [comments, setComments] = useState({});
  const [openComments, setOpenComments] = useState(null);
  const [newComment, setNewComment] = useState({});

  const homeAbbr = game.home;
  const awayAbbr = game.away;
  const homeScore = game.score?.[homeAbbr];
  const awayScore = game.score?.[awayAbbr];
  const isLive = game.status === "inprogress";
  const isScheduled = game.status === "scheduled";
  const isClosed = game.status === "closed";

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("game_takes")
      .select("*, profiles(avatar_url, is_shadowbanned)")
      .eq("game_id", game.id)
      .order("created_at", { ascending: false });
    setPosts(
      data?.filter(
        (p) => !p.profiles?.is_shadowbanned || p.user_id === user?.id,
      ) || [],
    );
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from("game_take_comments")
      .select("*, profiles(avatar_url, is_shadowbanned)")
      .order("created_at", { ascending: true });
    const grouped = {};
    data?.forEach((c) => {
      if (c.profiles?.is_shadowbanned && c.user_id !== user?.id) return;
      if (!grouped[c.game_take_id]) grouped[c.game_take_id] = [];
      grouped[c.game_take_id].push(c);
    });
    setComments(grouped);
  };

  const fetchModerators = async () => {
    const { data } = await supabase.from("moderators").select("user_id");
    setModeratorIds(new Set(data?.map((m) => m.user_id) || []));
  };

  useEffect(() => {
    const load = async () => {
      await fetchPosts();
      await fetchComments();
      await fetchModerators();
    };
    load();

    const channel = supabase
      .channel(`game-feed-${game.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_takes" },
        () => fetchPosts(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_take_comments" },
        () => fetchComments(),
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [game.id]);

  const postTake = async () => {
    if (!newPost.trim()) return;
    setLoading(true);
    setError("");
    try {
      const allowed = await moderateContent(newPost);
      if (!allowed) {
        setError("Your post contains inappropriate content.");
        setLoading(false);
        return;
      }
    } catch {
      /* continue */
    }
    await supabase
      .from("game_takes")
      .insert({
        game_id: game.id,
        content: newPost,
        user_id: user.id,
        username,
      });
    setNewPost("");
    await fetchPosts();
    setLoading(false);
  };

  const deletePost = async (postId) => {
    await supabase.from("game_takes").delete().eq("id", postId);
    await fetchPosts();
  };

  const postComment = async (postId) => {
    const content = newComment[postId]?.trim();
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
    await supabase.from("game_take_comments").insert({
      game_take_id: postId,
      user_id: user.id,
      username,
      content,
    });
    setNewComment((prev) => ({ ...prev, [postId]: "" }));
    await fetchComments();
  };

  const deleteComment = async (commentId) => {
    await supabase.from("game_take_comments").delete().eq("id", commentId);
    await fetchComments();
  };

  const homeColor = NBA_TEAM_COLORS[homeAbbr] || "#f97316";
  const awayColor = NBA_TEAM_COLORS[awayAbbr] || "#888";

  return (
    <div className="min-h-screen text-white" style={{ background: "#080810" }}>
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition cursor-pointer"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#71717a",
            }}
          >
            ← Back
          </button>
        </div>

        {/* Scoreboard */}
        <div
          className="rounded-2xl overflow-hidden mb-6"
          style={{
            background: "linear-gradient(135deg, #0f0f1a 0%, #151525 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="px-6 pt-5 pb-2 flex items-center justify-center">
            {isLive && (
              <div
                className="flex items-center gap-2 px-3 py-1 rounded-full"
                style={{
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.3)",
                }}
              >
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 text-xs font-bold uppercase tracking-wider">
                  Live
                </span>
              </div>
            )}
            {isScheduled && (
              <span className="text-zinc-400 text-sm">
                {new Date(game.start_time).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            )}
            {isClosed && (
              <span className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">
                Final
              </span>
            )}
          </div>

          <div className="flex items-center justify-between px-8 pb-8 pt-4">
            {/* Away */}
            <div className="flex flex-col items-center gap-3 flex-1">
              <img
                src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/${awayAbbr.toLowerCase()}.png`}
                alt={awayAbbr}
                className="w-20 h-20"
                onError={(e) => (e.target.style.display = "none")}
              />
              <span className="text-zinc-300 text-sm font-medium text-center">
                {game.teams[awayAbbr]?.name}
              </span>
              {!isScheduled && (
                <span
                  className="text-5xl font-black"
                  style={{ color: awayColor }}
                >
                  {awayScore}
                </span>
              )}
              {isScheduled && game.win_probability && (
                <span className="text-zinc-500 text-xs">
                  {game.win_probability[awayAbbr]}% win
                </span>
              )}
            </div>

            <div className="text-zinc-700 text-2xl font-black px-4">
              {isScheduled ? "VS" : "—"}
            </div>

            {/* Home */}
            <div className="flex flex-col items-center gap-3 flex-1">
              <img
                src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/${homeAbbr.toLowerCase()}.png`}
                alt={homeAbbr}
                className="w-20 h-20"
                onError={(e) => (e.target.style.display = "none")}
              />
              <span className="text-zinc-300 text-sm font-medium text-center">
                {game.teams[homeAbbr]?.name}
              </span>
              {!isScheduled && (
                <span
                  className="text-5xl font-black"
                  style={{ color: homeColor }}
                >
                  {homeScore}
                </span>
              )}
              {isScheduled && game.win_probability && (
                <span className="text-zinc-500 text-xs">
                  {game.win_probability[homeAbbr]}% win
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Compose */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{
            background: "linear-gradient(135deg, #0f0f1a 0%, #151525 100%)",
            border: "1px solid rgba(249,115,22,0.15)",
          }}
        >
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-sm font-black flex-shrink-0">
              {username?.[0]?.toUpperCase()}
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
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Talk about this game... 🏀"
                className="w-full bg-transparent text-white placeholder-zinc-600 resize-none outline-none text-sm leading-relaxed"
                rows={3}
              />
              <div
                className="flex justify-end mt-3 pt-3"
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
              >
                <button
                  onClick={postTake}
                  disabled={loading || !newPost.trim()}
                  className="px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer disabled:opacity-40"
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

        {/* Posts */}
        <div className="space-y-3">
          {posts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-5xl mb-4">🏀</p>
              <p className="text-zinc-500">
                No posts yet. Be the first to talk about this game!
              </p>
            </div>
          )}

          {posts.map((post) => (
            <div
              key={post.id}
              className="rounded-2xl p-5 transition group"
              style={{
                background: "linear-gradient(135deg, #0d0d1a 0%, #121220 100%)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  onClick={() => onViewProfile(post.username)}
                  className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-sm font-black overflow-hidden flex-shrink-0 cursor-pointer ring-2 ring-transparent hover:ring-orange-500 transition"
                >
                  {post.profiles?.avatar_url ? (
                    <img
                      src={post.profiles.avatar_url}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    post.username?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      onClick={() => onViewProfile(post.username)}
                      className="text-sm font-semibold text-white cursor-pointer hover:text-orange-400 transition"
                    >
                      @{post.username}
                    </span>
                    {moderatorIds.has(post.user_id) && (
                      <span title="Moderator" className="text-xs">
                        🛡️
                      </span>
                    )}
                  </div>
                  <span className="text-zinc-600 text-xs">
                    {new Date(post.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                {post.user_id === user?.id && (
                  <button
                    onClick={() => deletePost(post.id)}
                    className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-400 text-xs transition cursor-pointer px-2 py-1 rounded-lg hover:bg-red-500/10"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Content */}
              <p className="text-white text-sm leading-relaxed mb-4">
                {post.content}
              </p>

              {/* Comments toggle */}
              <button
                onClick={() =>
                  setOpenComments(openComments === post.id ? null : post.id)
                }
                className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-300 text-xs transition cursor-pointer"
              >
                <span>💬</span>
                <span>
                  {comments[post.id]?.length || 0}{" "}
                  {comments[post.id]?.length === 1 ? "comment" : "comments"}
                </span>
              </button>

              {/* Comments */}
              {openComments === post.id && (
                <div
                  className="mt-4 space-y-3"
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    paddingTop: "1rem",
                  }}
                >
                  {comments[post.id]?.map((c) => (
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
                      {c.user_id === user?.id && (
                        <button
                          onClick={() => deleteComment(c.id)}
                          className="opacity-0 group-hover/comment:opacity-100 text-zinc-700 hover:text-red-400 text-xs transition cursor-pointer mt-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}

                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={newComment[post.id] || ""}
                      onChange={(e) =>
                        setNewComment((prev) => ({
                          ...prev,
                          [post.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" && postComment(post.id)
                      }
                      placeholder="Add a comment..."
                      className="flex-1 text-white text-xs px-3 py-2 rounded-xl outline-none transition"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    />
                    <button
                      onClick={() => postComment(post.id)}
                      className="px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                      style={{
                        background: "linear-gradient(135deg, #f97316, #ef4444)",
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
        </div>
      </div>
    </div>
  );
}
