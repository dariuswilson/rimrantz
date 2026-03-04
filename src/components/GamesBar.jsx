import { useState, useEffect } from "react";
import BetModal from "../pages/BetModal";
import { placeBet } from "../utils/usePredictions";

export default function GamesBar({
  onGameClick,
  user,
  userBucks,
  onBucksUpdate,
}) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [betTarget, setBetTarget] = useState(null);

  const fetchGames = async () => {
    try {
      const res = await fetch("/api/nba-scores");
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setGames(data.games || []);
    } catch {
      setGames([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 20000);
    return () => clearInterval(interval);
  }, []);

  const todayGames = games.sort((a, b) => {
    const order = { inprogress: 0, scheduled: 1, closed: 2 };
    return (order[a.status] ?? 1) - (order[b.status] ?? 1);
  });

  const handleBetConfirm = async (amount, odds, payout) => {
    if (!betTarget || !user) return;
    try {
      await placeBet(
        user.id,
        betTarget.game,
        betTarget.team,
        amount,
        odds,
        payout,
      );
      if (onBucksUpdate) onBucksUpdate(userBucks - amount);
      setBetTarget(null);
    } catch {
      alert("Failed to place bet. Try again.");
    }
  };

  if (loading)
    return (
      <div
        className="mb-6 rounded-2xl p-4"
        style={{
          background: "linear-gradient(135deg, #1c1c1e 0%, #2a2a2e 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <p className="text-zinc-500 text-sm">Loading games...</p>
      </div>
    );

  if (todayGames.length === 0 && games.length === 0)
    return (
      <div
        className="mb-6 rounded-2xl p-4"
        style={{
          background: "linear-gradient(135deg, #1c1c1e 0%, #2a2a2e 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <p className="text-zinc-500 text-sm">No games today.</p>
      </div>
    );

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          🏀 Today's Games
        </h2>
        <div
          className="games-scroll"
          style={{
            display: "flex",
            gap: "12px",
            overflowX: "auto",
            paddingBottom: "12px",
            WebkitOverflowScrolling: "touch",
            scrollbarColor: "#f97316 #1c1c1e",
            scrollbarWidth: "thin",
          }}
        >
          {todayGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onGameClick={onGameClick}
              onBet={(team, prob) => setBetTarget({ game, team, prob })}
            />
          ))}
        </div>
        <style>{`
          .games-scroll::-webkit-scrollbar { height: 6px; }
          .games-scroll::-webkit-scrollbar-track { background: #1c1c1e; border-radius: 999px; }
          .games-scroll::-webkit-scrollbar-thumb { background: #f97316; border-radius: 999px; }
        `}</style>
      </div>

      {betTarget && (
        <BetModal
          game={betTarget.game}
          team={betTarget.team}
          odds={
            betTarget.prob
              ? betTarget.prob < 50
                ? Math.round(((100 - betTarget.prob) / betTarget.prob) * 100)
                : -Math.round((betTarget.prob / (100 - betTarget.prob)) * 100)
              : 100
          }
          userBucks={userBucks}
          onConfirm={handleBetConfirm}
          onClose={() => setBetTarget(null)}
        />
      )}
    </>
  );
}

function getGameStatus(game) {
  const { status, clock, period, shortDetail = "", statusDetail = "" } = game;
  if (status === "closed")
    return { label: "Final", isLive: false, isFinal: true };
  if (status === "inprogress") {
    const detail = (shortDetail || statusDetail || "").toLowerCase();
    if (detail.includes("half")) return { label: "Halftime", isLive: true };
    if (detail.includes("end") || detail.includes("int"))
      return { label: detail, isLive: true };
    const noTime = !clock || clock === "0:00" || clock === "00:00";
    if (noTime && period === 2) return { label: "Halftime", isLive: true };
    if (noTime)
      return {
        label: period > 4 ? `OT${period - 4} End` : `End Q${period}`,
        isLive: true,
      };
    return {
      label:
        period > 4 ? `OT${period - 4} · ${clock}` : `Q${period} · ${clock}`,
      isLive: true,
    };
  }
  return {
    label: new Date(game.start_time).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
    isLive: false,
    isScheduled: true,
  };
}

function GameCard({ game, onGameClick, onBet }) {
  const homeAbbr = game.home;
  const awayAbbr = game.away;
  const homeScore = game.score?.[homeAbbr];
  const awayScore = game.score?.[awayAbbr];
  const isClosed = game.status === "closed";
  const isLive = game.status === "inprogress";

  const homeWinProb = game.win_probability?.[homeAbbr];
  const awayWinProb = game.win_probability?.[awayAbbr];

  const { label, isScheduled } = getGameStatus(game);

  const showScore = !isScheduled; // show score for live AND final games
  const showBets = !isClosed;

  return (
    <div
      className="flex-shrink-0 rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f0f1a 0%, #151525 100%)",
        border: isLive
          ? "1px solid rgba(239,68,68,0.4)"
          : "1px solid rgba(255,255,255,0.06)",
        minWidth: "175px",
      }}
    >
      {/* Clickable score area */}
      <div
        onClick={() => onGameClick(game)}
        className="p-4 cursor-pointer hover:bg-white/5 transition"
      >
        {/* Status row */}
        <div className="flex items-center gap-1.5 mb-3">
          {isLive && (
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
          )}
          <span
            className={`text-xs font-semibold ${isLive ? "text-red-400" : "text-zinc-500"}`}
          >
            {label}
          </span>
        </div>

        {/* Away team */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <img
              src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/${awayAbbr.toLowerCase()}.png`}
              alt={awayAbbr}
              className="w-6 h-6"
              onError={(e) => (e.target.style.display = "none")}
            />
            <span className="text-zinc-300 text-sm font-medium">
              {awayAbbr}
            </span>
          </div>
          {showScore && (
            <span
              className={`text-sm font-bold ${awayScore > homeScore ? "text-white" : "text-zinc-500"}`}
            >
              {awayScore}
            </span>
          )}
        </div>

        {/* Home team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/${homeAbbr.toLowerCase()}.png`}
              alt={homeAbbr}
              className="w-6 h-6"
              onError={(e) => (e.target.style.display = "none")}
            />
            <span className="text-zinc-300 text-sm font-medium">
              {homeAbbr}
            </span>
          </div>
          {showScore && (
            <span
              className={`text-sm font-bold ${homeScore > awayScore ? "text-white" : "text-zinc-500"}`}
            >
              {homeScore}
            </span>
          )}
        </div>
      </div>

      {/* Bet buttons - show for scheduled AND live games */}
      {showBets && (homeWinProb || awayWinProb) && (
        <div className="px-3 pb-3 flex gap-2">
          <button
            onClick={() => onBet(awayAbbr, awayWinProb)}
            className="flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer hover:opacity-80"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: awayWinProb && awayWinProb < 50 ? "#22c55e" : "#f97316",
            }}
          >
            {awayAbbr} {awayWinProb ? `${Math.round(awayWinProb)}%` : "—"}
          </button>
          <button
            onClick={() => onBet(homeAbbr, homeWinProb)}
            className="flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer hover:opacity-80"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: homeWinProb && homeWinProb < 50 ? "#22c55e" : "#f97316",
            }}
          >
            {homeAbbr} {homeWinProb ? `${Math.round(homeWinProb)}%` : "—"}
          </button>
        </div>
      )}
    </div>
  );
}
