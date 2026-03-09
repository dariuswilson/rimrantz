import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";

const STATUS_COLORS = {
  pending: { bg: "rgba(234,179,8,0.15)", color: "#eab308", label: "Pending" },
  resolved: { bg: "rgba(34,197,94,0.15)", color: "#22c55e", label: "Resolved" },
  dismissed: {
    bg: "rgba(113,113,122,0.15)",
    color: "#71717a",
    label: "Dismissed",
  },
};

const CONTENT_ICONS = {
  post: "📝",
  comment: "💬",
  profile: "👤",
  group_message: "👥",
};

export default function ModeratorPanel({
  user,
  onBack,
  onViewProfile,
  ...props
}) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [expanded, setExpanded] = useState(null);
  const [actioning, setActioning] = useState(null);
  const [shadowbanned, setShadowbanned] = useState([]);

  const fetchReports = async () => {
    setLoading(true);
    const query = supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (filter !== "all") query.eq("status", filter);
    const { data } = await query;
    setReports(data || []);
    setLoading(false);
  };

  const fetchShadowbanned = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, username, strike_count, avatar_url")
      .eq("is_shadowbanned", true);
    setShadowbanned(data || []);
  };

  useEffect(() => {
    const load = async () => {
      await fetchReports();
      await fetchShadowbanned();
    };
    load();
  }, [filter]);

  const takeAction = async (report, action) => {
    setActioning(report.id);
    try {
      if (action === "delete_content") {
        if (report.content_type === "post") {
          const { error: e1 } = await supabase
            .from("takes")
            .delete()
            .eq("id", report.content_id);
          if (e1)
            await supabase
              .from("game_takes")
              .delete()
              .eq("id", report.content_id);
        } else if (report.content_type === "comment") {
          const { error: e2 } = await supabase
            .from("comments")
            .delete()
            .eq("id", report.content_id);
          if (e2)
            await supabase
              .from("game_take_comments")
              .delete()
              .eq("id", report.content_id);
        } else if (report.content_type === "group_message") {
          await supabase.from("messages").delete().eq("id", report.content_id);
        }
      } else if (action === "shadowban") {
        await supabase
          .from("profiles")
          .update({ is_shadowbanned: true })
          .eq("user_id", report.reported_user_id);
      } else if (action === "strike") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("strike_count")
          .eq("user_id", report.reported_user_id)
          .single();
        const newCount = (profile?.strike_count || 0) + 1;
        await supabase
          .from("profiles")
          .update({
            strike_count: newCount,
            is_shadowbanned: newCount >= 3 ? true : undefined,
          })
          .eq("user_id", report.reported_user_id);
      } else if (action === "ban") {
        await supabase
          .from("profiles")
          .update({ banned: true })
          .eq("user_id", report.reported_user_id);
      }

      await supabase
        .from("reports")
        .update({
          status: action === "dismiss" ? "dismissed" : "resolved",
          action_taken: action,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", report.id);

      fetchReports();
      setExpanded(null);
    } catch (err) {
      console.error("Action failed:", err);
    }
    setActioning(null);
  };

  const pendingCount = reports.filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-screen text-white" style={{ background: "#080810" }}>
      <Navbar {...props} />

      <div className="max-w-3xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="px-3 py-2 rounded-xl text-sm transition cursor-pointer"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#71717a",
            }}
          >
            ← Back
          </button>
          <div>
            <h1 className="text-white font-bold text-xl flex items-center gap-2">
              🛡️ Moderator Panel
            </h1>
            <p className="text-zinc-500 text-xs mt-0.5">
              {pendingCount} pending report{pendingCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div
          className="flex gap-2 mb-6 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {["pending", "resolved", "dismissed", "all", "shadowbanned"].map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer capitalize"
                style={{
                  background:
                    filter === f
                      ? "linear-gradient(135deg, #f97316, #ef4444)"
                      : "rgba(255,255,255,0.05)",
                  color: filter === f ? "white" : "#71717a",
                  border:
                    filter === f
                      ? "1px solid transparent"
                      : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {f}
              </button>
            ),
          )}
        </div>

        {/* Reports */}
        {filter === "shadowbanned" ? (
          <div className="space-y-3">
            {shadowbanned.length === 0 ? (
              <div
                className="rounded-2xl p-12 text-center"
                style={{
                  background:
                    "linear-gradient(135deg, #0f0f1a 0%, #151525 100%)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p className="text-4xl mb-3">✅</p>
                <p className="text-white font-semibold">
                  No shadowbanned users
                </p>
              </div>
            ) : (
              shadowbanned.map((u) => (
                <div
                  key={u.user_id}
                  className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{
                    background:
                      "linear-gradient(135deg, #0f0f1a 0%, #151525 100%)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    onClick={() => onViewProfile(u.username)}
                    className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-sm font-bold overflow-hidden flex-shrink-0 cursor-pointer"
                  >
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
                    <p
                      className="text-white text-sm font-medium cursor-pointer hover:text-orange-400 transition"
                      onClick={() => onViewProfile(u.username)}
                    >
                      @{u.username}
                    </p>
                    <p className="text-red-400 text-xs">
                      {u.strike_count}/3 strikes
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      await supabase
                        .from("profiles")
                        .update({ is_shadowbanned: false, strike_count: 0 })
                        .eq("user_id", u.user_id);
                      fetchShadowbanned();
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
                    style={{
                      background: "rgba(34,197,94,0.15)",
                      border: "1px solid rgba(34,197,94,0.3)",
                      color: "#22c55e",
                    }}
                  >
                    ✓ Unban
                  </button>
                </div>
              ))
            )}
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-2xl animate-pulse"
                style={{ background: "rgba(255,255,255,0.04)" }}
              />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{
              background: "linear-gradient(135deg, #0f0f1a 0%, #151525 100%)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <p className="text-4xl mb-3">✅</p>
            <p className="text-white font-semibold">No {filter} reports</p>
            <p className="text-zinc-500 text-sm mt-1">All clear!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const statusStyle = STATUS_COLORS[report.status];
              const isExpanded = expanded === report.id;

              return (
                <div
                  key={report.id}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(135deg, #0f0f1a 0%, #151525 100%)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {/* Report row */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer"
                    onClick={() => setExpanded(isExpanded ? null : report.id)}
                  >
                    <div className="text-xl flex-shrink-0">
                      {CONTENT_ICONS[report.content_type] || "📄"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white text-sm font-semibold">
                          @{report.reported_username}
                        </p>
                        <span className="text-zinc-600 text-xs">
                          reported by
                        </span>
                        <p className="text-zinc-400 text-xs">
                          @{report.reporter_username}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            color: "#a1a1aa",
                          }}
                        >
                          {report.reason}
                        </span>
                        <span className="text-zinc-600 text-xs capitalize">
                          {report.content_type}
                        </span>
                        <span className="text-zinc-600 text-xs">
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.color,
                        }}
                      >
                        {statusStyle.label}
                      </span>
                      <span className="text-zinc-600 text-xs">
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div
                      className="px-4 pb-4 border-t"
                      style={{ borderColor: "rgba(255,255,255,0.06)" }}
                    >
                      {/* Content preview */}
                      {report.content_preview && (
                        <div
                          className="rounded-xl p-3 my-4 text-zinc-400 text-xs italic"
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          "{report.content_preview}"
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                        <div>
                          <p className="text-zinc-600 uppercase tracking-wider mb-1">
                            Reporter
                          </p>
                          <p
                            className="text-orange-400 cursor-pointer hover:underline"
                            onClick={() =>
                              onViewProfile(report.reporter_username)
                            }
                          >
                            @{report.reporter_username}
                          </p>
                        </div>
                        <div>
                          <p className="text-zinc-600 uppercase tracking-wider mb-1">
                            Reported User
                          </p>
                          <p
                            className="text-orange-400 cursor-pointer hover:underline"
                            onClick={() =>
                              onViewProfile(report.reported_username)
                            }
                          >
                            @{report.reported_username}
                          </p>
                        </div>
                        <div>
                          <p className="text-zinc-600 uppercase tracking-wider mb-1">
                            Content Type
                          </p>
                          <p className="text-zinc-300 capitalize">
                            {report.content_type}
                          </p>
                        </div>
                        <div>
                          <p className="text-zinc-600 uppercase tracking-wider mb-1">
                            Submitted
                          </p>
                          <p className="text-zinc-300">
                            {new Date(report.created_at).toLocaleString()}
                          </p>
                        </div>
                        {report.action_taken && (
                          <div>
                            <p className="text-zinc-600 uppercase tracking-wider mb-1">
                              Action Taken
                            </p>
                            <p className="text-zinc-300 capitalize">
                              {report.action_taken.replace("_", " ")}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions — only for pending */}
                      {report.status === "pending" && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => takeAction(report, "dismiss")}
                            disabled={actioning === report.id}
                            className="px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-40"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              color: "#71717a",
                              border: "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => takeAction(report, "delete_content")}
                            disabled={actioning === report.id}
                            className="px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-40"
                            style={{
                              background: "rgba(239,68,68,0.15)",
                              color: "#ef4444",
                              border: "1px solid rgba(239,68,68,0.2)",
                            }}
                          >
                            🗑️ Delete Content
                          </button>
                          <button
                            onClick={() => takeAction(report, "shadowban")}
                            disabled={actioning === report.id}
                            className="px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-40"
                            style={{
                              background: "rgba(168,85,247,0.15)",
                              color: "#a855f7",
                              border: "1px solid rgba(168,85,247,0.2)",
                            }}
                          >
                            👻 Shadowban
                          </button>
                          <button
                            onClick={() => takeAction(report, "strike")}
                            disabled={actioning === report.id}
                            className="px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-40"
                            style={{
                              background: "rgba(234,179,8,0.15)",
                              color: "#eab308",
                              border: "1px solid rgba(234,179,8,0.2)",
                            }}
                          >
                            ⚠️ Strike
                          </button>
                          <button
                            onClick={() => takeAction(report, "ban")}
                            disabled={actioning === report.id}
                            className="px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-40"
                            style={{
                              background: "rgba(239,68,68,0.15)",
                              color: "#ef4444",
                              border: "1px solid rgba(239,68,68,0.3)",
                            }}
                          >
                            🔨 Ban User
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
