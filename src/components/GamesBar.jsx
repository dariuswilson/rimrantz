import { useState, useEffect } from "react";

export default function GamesBar({ onGameClick }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

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
    const interval = setInterval(fetchGames, 30000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date().toDateString();
  const tomorrow = new Date(new Date().getTime() + 86400000).toDateString();

  const todayGames = games.filter((g) => {
    const gameDate = new Date(g.start_time).toDateString();
    return gameDate === today || gameDate === tomorrow;
  });

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

  if (todayGames.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
        🏀 Today's Games
      </h2>

      {/* Scrollable container with visible scrollbar */}
      <div
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
            onClick={() => onGameClick(game)}
          />
        ))}
      </div>

      <style>{`
        .games-scroll::-webkit-scrollbar {
          height: 6px;
        }
        .games-scroll::-webkit-scrollbar-track {
          background: #1c1c1e;
          border-radius: 999px;
        }
        .games-scroll::-webkit-scrollbar-thumb {
          background: #f97316;
          border-radius: 999px;
        }
      `}</style>
    </div>
  );
}

function GameCard({ game, onClick }) {
  const homeAbbr = game.home;
  const awayAbbr = game.away;
  const homeScore = game.score?.[homeAbbr];
  const awayScore = game.score?.[awayAbbr];
  const isLive = game.status === "inprogress";
  const isScheduled = game.status === "scheduled";
  const isClosed = game.status === "closed";

  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 rounded-2xl p-4 cursor-pointer transition hover:scale-105"
      style={{
        background: "linear-gradient(135deg, #1c1c1e 0%, #2a2a2e 100%)",
        border: isLive
          ? "1px solid rgba(239,68,68,0.4)"
          : "1px solid rgba(255,255,255,0.06)",
        minWidth: "160px",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        {isLive && (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 text-xs font-bold">LIVE</span>
          </div>
        )}
        {isScheduled && (
          <span className="text-zinc-500 text-xs">
            {new Date(game.start_time).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        )}
        {isClosed && <span className="text-zinc-600 text-xs">Final</span>}
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <img
            src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/${awayAbbr.toLowerCase()}.png`}
            alt={awayAbbr}
            className="w-6 h-6"
            onError={(e) => (e.target.style.display = "none")}
          />
          <span className="text-zinc-300 text-sm font-medium">{awayAbbr}</span>
        </div>
        {!isScheduled && (
          <span
            className={`text-sm font-bold ${awayScore > homeScore ? "text-white" : "text-zinc-400"}`}
          >
            {awayScore}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/${homeAbbr.toLowerCase()}.png`}
            alt={homeAbbr}
            className="w-6 h-6"
            onError={(e) => (e.target.style.display = "none")}
          />
          <span className="text-zinc-300 text-sm font-medium">{homeAbbr}</span>
        </div>
        {!isScheduled && (
          <span
            className={`text-sm font-bold ${homeScore > awayScore ? "text-white" : "text-zinc-400"}`}
          >
            {homeScore}
          </span>
        )}
      </div>

      {isScheduled && game.win_probability && (
        <div className="mt-2 pt-2 border-t border-white/5">
          <div className="flex justify-between text-xs text-zinc-600">
            <span>{game.win_probability[awayAbbr]}%</span>
            <span>{game.win_probability[homeAbbr]}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
