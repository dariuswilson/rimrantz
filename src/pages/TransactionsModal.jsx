import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export default function TransactionsModal({ userId, username, onClose }) {
  const [bets, setBets] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("bets");

  useEffect(() => {
    const loadData = async () => {
      const [{ data: betsData }, { data: purchasesData }] = await Promise.all([
        supabase
          .from("predictions")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("shop_purchases")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ]);
      setBets(betsData || []);
      setPurchases(purchasesData || []);
      setLoading(false);
    };

    loadData();
  }, [userId]);

  const totalWon = bets
    .filter((t) => t.status === "won")
    .reduce((sum, t) => sum + (t.payout - t.amount), 0);
  const totalLost = bets
    .filter((t) => t.status === "lost")
    .reduce((sum, t) => sum + t.amount, 0);
  const pending = bets.filter((t) => t.status === "pending").length;
  const totalSpent = purchases.reduce((sum, p) => sum + p.price, 0);

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

        {/* Tabs */}
        <div
          className="flex gap-1 px-6 pt-4 pb-2"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <button
            onClick={() => setTab("bets")}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            style={{
              background:
                tab === "bets"
                  ? "rgba(249,115,22,0.15)"
                  : "rgba(255,255,255,0.04)",
              border:
                tab === "bets"
                  ? "1px solid rgba(249,115,22,0.3)"
                  : "1px solid rgba(255,255,255,0.06)",
              color: tab === "bets" ? "#f97316" : "#71717a",
            }}
          >
            🎲 Bets
          </button>
          <button
            onClick={() => setTab("shop")}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            style={{
              background:
                tab === "shop"
                  ? "rgba(249,115,22,0.15)"
                  : "rgba(255,255,255,0.04)",
              border:
                tab === "shop"
                  ? "1px solid rgba(249,115,22,0.3)"
                  : "1px solid rgba(255,255,255,0.06)",
              color: tab === "shop" ? "#f97316" : "#71717a",
            }}
          >
            🛍️ Shop
          </button>
        </div>

        {/* Bets Tab */}
        {tab === "bets" && (
          <>
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

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {loading && (
                <p className="text-zinc-500 text-sm text-center py-8">
                  Loading...
                </p>
              )}
              {!loading && bets.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">🏀</p>
                  <p className="text-zinc-500 text-sm">No bets placed yet!</p>
                </div>
              )}
              {bets.map((t) => {
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
                            <p className="text-zinc-600 text-xs mt-0.5">
                              Lost 💀
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Shop Tab */}
        {tab === "shop" && (
          <>
            {/* Summary */}
            <div
              className="flex gap-3 px-6 py-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div
                className="flex-1 rounded-xl p-3 text-center"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.15)",
                }}
              >
                <p className="text-red-400 font-black text-lg">
                  -{totalSpent.toLocaleString()}
                </p>
                <p className="text-zinc-500 text-xs mt-0.5">Total Spent</p>
              </div>
              <div
                className="flex-1 rounded-xl p-3 text-center"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <p className="text-white font-black text-lg">
                  {purchases.length}
                </p>
                <p className="text-zinc-500 text-xs mt-0.5">Items Bought</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {loading && (
                <p className="text-zinc-500 text-sm text-center py-8">
                  Loading...
                </p>
              )}
              {!loading && purchases.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">🛍️</p>
                  <p className="text-zinc-500 text-sm">
                    No shop purchases yet!
                  </p>
                </div>
              )}
              {purchases.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl p-4"
                  style={{
                    background: "rgba(239,68,68,0.06)",
                    border: "1px solid rgba(239,68,68,0.15)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">
                        🛍️ {p.item_name}
                      </p>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        Shop purchase
                      </p>
                      <p className="text-zinc-600 text-xs mt-1">
                        {new Date(p.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-red-400 text-sm font-bold">
                        -💰{p.price.toLocaleString()}
                      </p>
                      <p className="text-zinc-600 text-xs mt-0.5">Spent 🛒</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
