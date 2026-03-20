import { useState } from "react";
import { supabase } from "../supabase";

const REASONS = [
  "Spam",
  "Harassment",
  "Hate speech",
  "Inappropriate content",
  "Other",
];

export default function ReportModal({
  reporter,
  reporterUsername,
  reportedUserId,
  reportedUsername,
  contentType,
  contentId,
  contentPreview,
  onClose,
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!reason) return;
    setSubmitting(true);
    const { error: reportError } = await supabase.from("reports").insert({
      reporter_id: reporter.id,
      reporter_username: reporterUsername,
      reported_user_id: reportedUserId,
      reported_username: reportedUsername,
      content_type: contentType,
      content_id: contentId,
      content_preview: contentPreview?.slice(0, 300),
      reason,
      status: "pending",
    });
    if (reportError) {
      console.error("Report insert error:", reportError);
      return;
    }
    setDone(true);
    setSubmitting(false);
    setTimeout(onClose, 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{
          background: "linear-gradient(135deg, #0f0f1a 0%, #151525 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="text-center py-4">
            <p className="text-3xl mb-3">✅</p>
            <p className="text-white font-semibold">Report submitted</p>
            <p className="text-zinc-500 text-sm mt-1">
              Our moderators will review it shortly.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-white font-bold text-base">Report</p>
                <p className="text-zinc-500 text-xs mt-0.5">
                  Reporting @{reportedUsername} · {contentType}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-500 hover:text-white transition text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {contentPreview && (
              <div
                className="rounded-xl p-3 mb-5 text-zinc-400 text-xs italic"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                "{contentPreview.slice(0, 120)}
                {contentPreview.length > 120 ? "..." : ""}"
              </div>
            )}

            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Reason
            </p>
            <div className="space-y-2 mb-6">
              {REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition cursor-pointer text-left"
                  style={{
                    background:
                      reason === r
                        ? "rgba(249,115,22,0.15)"
                        : "rgba(255,255,255,0.04)",
                    border:
                      reason === r
                        ? "1px solid rgba(249,115,22,0.4)"
                        : "1px solid rgba(255,255,255,0.06)",
                    color: reason === r ? "#f97316" : "#a1a1aa",
                  }}
                >
                  <span
                    className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                    style={{
                      borderColor: reason === r ? "#f97316" : "#52525b",
                      background: reason === r ? "#f97316" : "transparent",
                    }}
                  >
                    {reason === r && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                    )}
                  </span>
                  {r}
                </button>
              ))}
            </div>

            <button
              onClick={submit}
              disabled={!reason || submitting}
              className="w-full py-3 rounded-xl text-sm font-bold transition cursor-pointer disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #f97316, #ef4444)",
                color: "white",
              }}
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
