import { useState, useEffect } from "react";
import { supabase } from "../supabase";

async function settleNow(userId) {
  // Fetch pending predictions
  const { data: pending } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending");

  if (!pending || pending.length === 0) return 0;

  // Fetch current scores
  let games = [];
  try {
    const res = await fetch("/api/nba-scores");
    const data = await res.json();
    games = data.games || [];
  } catch {
    return 0;
  }

  const finishedGames = games.filter((g) => g.status === "closed");
  let totalWinnings = 0;

  for (const pred of pending) {
    const game = finishedGames.find((g) => g.id === pred.game_id);
    if (!game) continue;

    const homeScore = game.score[game.home];
    const awayScore = game.score[game.away];
    const winner = homeScore > awayScore ? game.home : game.away;
    const won = winner === pred.team_picked;

    await supabase
      .from("predictions")
      .update({
        status: won ? "won" : "lost",
        settled_at: new Date().toISOString(),
      })
      .eq("id", pred.id);

    if (won) totalWinnings += pred.payout;
  }

  if (totalWinnings > 0) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nba_bucks")
      .eq("user_id", userId)
      .single();

    const newBalance = (profile?.nba_bucks || 0) + totalWinnings;
    await supabase
      .from("profiles")
      .update({ nba_bucks: newBalance })
      .eq("user_id", userId);

    return totalWinnings;
  }
  return 0;
}

export default function TransactionsModal({
  userId,
  username,
  onClose,
  onBucksUpdate,
}) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);
  const [settledMessage, setSettledMessage] = useState("");

  const loadTransactions = async () => {
    const { data } = await supabase
      .from("predictions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setTransactions(data || []);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      setSettling(true);
      const winnings = await settleNow(userId);
      if (winnings > 0) {
        setSettledMessage(
          `🎉 Settled! You won 💰${winnings.toLocaleString()} NBA Bucks!`,
        );
        if (onBucksUpdate) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("nba_bucks")
            .eq("user_id", userId)
            .single();
          onBucksUpdate(profile?.nba_bucks || 0);
        }
      }
      setSettling(false);
      await loadTransactions();
    };
    init();
  }, [userId]);

  const totalWon = transactions
    .filter((t) => t.status === "won")
    .reduce((sum, t) => sum + (t.payout - t.amount), 0);
  const totalLost = transactions
    .filter((t) => t.status === "lost")
    .reduce((sum, t) => sum + t.amount, 0);
  const pending = transactions.filter((t) => t.status === "pending").length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl flex flex-col"
        style={{
          background: "linear-gradient(135deg, #0f0f1a 0%, #151525 100%)",
          border: "1px solid rgba(249,115,22,0.2)",
          maxHeight: "80vh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 pb-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div>
            <h2 className="text-white font-bold text-lg">
              💰 NBA Bucks History
            </h2>
            <p className="text-zinc-500 text-xs mt-0.5">
              @{username}'s transactions
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition cursor-pointer text-xl"
          >
            ✕
          </button>
        </div>

        {/* Settling indicator */}
        {settling && (
          <div
            className="px-6 py-3 text-xs text-zinc-400 text-center"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            Checking for settled bets...
          </div>
        )}
        {settledMessage && (
          <div
            className="px-6 py-3 text-xs text-center font-semibold"
            style={{
              background: "rgba(34,197,94,0.1)",
              borderBottom: "1px solid rgba(34,197,94,0.2)",
              color: "#22c55e",
            }}
          >
            {settledMessage}
          </div>
        )}

        {/* Summary */}
        <div
          className="flex gap-3 px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div
            className="flex-1 rounded-xl p-3 text-center"
            style={{
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.15)",
            }}
          >
            <p className="text-green-400 font-black text-lg">
              +{totalWon.toLocaleString()}
            </p>
            <p className="text-zinc-500 text-xs mt-0.5">Total Won</p>
          </div>
          <div
            className="flex-1 rounded-xl p-3 text-center"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.15)",
            }}
          >
            <p className="text-red-400 font-black text-lg">
              -{totalLost.toLocaleString()}
            </p>
            <p className="text-zinc-500 text-xs mt-0.5">Total Lost</p>
          </div>
          <div
            className="flex-1 rounded-xl p-3 text-center"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <p className="text-white font-black text-lg">{pending}</p>
            <p className="text-zinc-500 text-xs mt-0.5">Pending</p>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading && (
            <p className="text-zinc-500 text-sm text-center py-8">Loading...</p>
          )}

          {!loading && transactions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🏀</p>
              <p className="text-zinc-500 text-sm">No bets placed yet!</p>
            </div>
          )}

          {transactions.map((t) => {
            const isWon = t.status === "won";
            const isLost = t.status === "lost";
            const isPending = t.status === "pending";
            const profit = t.payout - t.amount;

            return (
              <div
                key={t.id}
                className="rounded-xl p-4"
                style={{
                  background: isWon
                    ? "rgba(34,197,94,0.06)"
                    : isLost
                      ? "rgba(239,68,68,0.06)"
                      : "rgba(255,255,255,0.03)",
                  border: isWon
                    ? "1px solid rgba(34,197,94,0.15)"
                    : isLost
                      ? "1px solid rgba(239,68,68,0.15)"
                      : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">
                      {t.game_label}
                    </p>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      Bet on{" "}
                      <span className="text-zinc-300">{t.team_picked}</span>
                    </p>
                    <p className="text-zinc-600 text-xs mt-1">
                      {new Date(t.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {isPending && (
                      <>
                        <p className="text-red-400 text-sm font-bold">
                          -💰{t.amount.toLocaleString()}
                        </p>
                        <p className="text-zinc-500 text-xs mt-0.5">
                          Pending ⏳
                        </p>
                        <p className="text-zinc-600 text-xs">
                          Win: +💰{profit.toLocaleString()}
                        </p>
                      </>
                    )}
                    {isWon && (
                      <>
                        <p className="text-green-400 text-sm font-bold">
                          +💰{profit.toLocaleString()}
                        </p>
                        <p className="text-zinc-500 text-xs mt-0.5 line-through">
                          -💰{t.amount.toLocaleString()}
                        </p>
                        <p className="text-green-600 text-xs">Won 🎉</p>
                      </>
                    )}
                    {isLost && (
                      <>
                        <p className="text-red-400 text-sm font-bold">
                          -💰{t.amount.toLocaleString()}
                        </p>
                        <p className="text-zinc-600 text-xs mt-0.5">Lost 💀</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
