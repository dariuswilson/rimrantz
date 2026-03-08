import { useState } from "react";

export default function BetModal({
  game,
  team,
  odds,
  userBucks,
  onConfirm,
  onClose,
}) {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false); // ← was hardcoded false before

  const numAmount = parseInt(amount) || 0;

  const calcPayout = (amt, odds) => {
    if (!amt || amt <= 0) return 0;
    if (odds > 0) return amt + Math.floor((amt * odds) / 100);
    else return amt + Math.floor((amt * 100) / Math.abs(odds));
  };

  const payout = calcPayout(numAmount, odds);
  const profit = payout - numAmount;
  const isValid = numAmount >= 10 && numAmount <= userBucks;

  const homeAbbr = game.home;
  const awayAbbr = game.away;
  const opponentTeam = team === homeAbbr ? awayAbbr : homeAbbr;

  const handleConfirm = async () => {
    if (isLoading || !isValid) return; // ← double-click guard
    setIsLoading(true);
    try {
      await onConfirm(numAmount, odds, payout);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && !isLoading && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{
          background: "linear-gradient(135deg, #0f0f1a 0%, #151525 100%)",
          border: "1px solid rgba(249,115,22,0.2)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-lg">Place Bet</h2>
          <button
            onClick={() => !isLoading && onClose()}
            className="text-zinc-500 hover:text-white transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Matchup */}
        <div
          className="rounded-xl p-4 mb-5 text-center"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <img
              src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/${awayAbbr.toLowerCase()}.png`}
              className="w-8 h-8"
              alt={awayAbbr}
              onError={(e) => (e.target.style.display = "none")}
            />
            <span className="text-zinc-500 text-sm">vs</span>
            <img
              src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/${homeAbbr.toLowerCase()}.png`}
              className="w-8 h-8"
              alt={homeAbbr}
              onError={(e) => (e.target.style.display = "none")}
            />
          </div>
          <p className="text-zinc-400 text-xs">
            Betting on{" "}
            <span className="text-white font-bold">
              {game.teams[team]?.name}
            </span>{" "}
            to beat {game.teams[opponentTeam]?.name}
          </p>
          <div className="mt-2">
            <span
              className="text-lg font-black"
              style={{ color: odds > 0 ? "#22c55e" : "#f97316" }}
            >
              {odds > 0 ? `+${odds}` : odds}
            </span>
          </div>
        </div>

        {/* Balance */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-zinc-500 text-xs">Your balance</span>
          <span className="text-white text-sm font-bold">
            💰 {userBucks.toLocaleString()} NBA Bucks
          </span>
        </div>

        {/* Amount input */}
        <div className="relative mb-2">
          <input
            type="number"
            placeholder="Amount to wager"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={10}
            max={userBucks}
            disabled={isLoading}
            className="w-full text-white text-sm px-4 py-3 rounded-xl outline-none"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              opacity: isLoading ? 0.5 : 1,
            }}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">
            min 10
          </span>
        </div>

        {/* Quick amounts */}
        <div className="flex gap-2 mb-5">
          {[50, 100, 250, 500]
            .filter((v) => v <= userBucks)
            .map((v) => (
              <button
                key={v}
                onClick={() => !isLoading && setAmount(String(v))}
                disabled={isLoading}
                className="flex-1 py-1.5 rounded-lg text-xs transition cursor-pointer"
                style={{
                  background:
                    amount === String(v)
                      ? "rgba(249,115,22,0.2)"
                      : "rgba(255,255,255,0.05)",
                  border:
                    amount === String(v)
                      ? "1px solid rgba(249,115,22,0.4)"
                      : "1px solid rgba(255,255,255,0.08)",
                  color: amount === String(v) ? "#f97316" : "#71717a",
                }}
              >
                {v}
              </button>
            ))}
          <button
            onClick={() => !isLoading && setAmount(String(userBucks))}
            disabled={isLoading}
            className="flex-1 py-1.5 rounded-lg text-xs transition cursor-pointer"
            style={{
              background:
                amount === String(userBucks)
                  ? "rgba(249,115,22,0.2)"
                  : "rgba(255,255,255,0.05)",
              border:
                amount === String(userBucks)
                  ? "1px solid rgba(249,115,22,0.4)"
                  : "1px solid rgba(255,255,255,0.08)",
              color: amount === String(userBucks) ? "#f97316" : "#71717a",
            }}
          >
            All in
          </button>
        </div>

        {/* Payout preview */}
        {numAmount > 0 && (
          <div
            className="rounded-xl p-4 mb-5"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-500">Wager</span>
              <span className="text-white">
                💰 {numAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-500">Profit if win</span>
              <span className="text-green-400">
                +💰 {profit.toLocaleString()}
              </span>
            </div>
            <div
              className="flex justify-between text-sm pt-2"
              style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
            >
              <span className="text-zinc-400 font-medium">Total payout</span>
              <span className="text-white font-bold">
                💰 {payout.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {numAmount > userBucks && (
          <p className="text-red-400 text-xs mb-3">Not enough NBA Bucks!</p>
        )}

        <button
          onClick={handleConfirm}
          disabled={!isValid || isLoading}
          className="w-full py-3 rounded-xl text-sm font-bold transition cursor-pointer disabled:opacity-40"
          style={{
            background: "linear-gradient(135deg, #f97316, #ef4444)",
            color: "white",
            pointerEvents: isLoading ? "none" : "auto", // extra safety layer
          }}
        >
          {isLoading ? "Placing Bet..." : "Confirm Bet 🏀"}
        </button>
      </div>
    </div>
  );
}
