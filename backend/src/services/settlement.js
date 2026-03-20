const { adminClient } = require("./supabase");
const { normalizeTeam } = require("../lib/nbaTeams");

const SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";

async function fetchFinishedGameWinners() {
  const gamesRes = await fetch(SCOREBOARD_URL);
  const gamesData = await gamesRes.json();

  return (gamesData.events || [])
    .filter((e) => e.status?.type?.name === "STATUS_FINAL")
    .map((e) => {
      const comp = e.competitions?.[0];
      const home = comp?.competitors?.find((t) => t.homeAway === "home");
      const away = comp?.competitors?.find((t) => t.homeAway === "away");
      const homeScore = parseInt(home?.score) || 0;
      const awayScore = parseInt(away?.score) || 0;
      const winner = homeScore > awayScore ? home?.team?.abbreviation : away?.team?.abbreviation;

      return {
        game_id: String(e.id),
        winner: normalizeTeam(String(winner || "").toUpperCase()),
      };
    })
    .filter((g) => g.game_id && g.winner);
}

async function fetchFinishedWinnerForGame(gameId) {
  const target = String(gameId);
  const winners = await fetchFinishedGameWinners();
  return winners.find((g) => g.game_id === target) || null;
}

async function runAtomicSettlement() {
  const finishedGames = await fetchFinishedGameWinners();
  if (finishedGames.length === 0) {
    return { settled: 0, credited_users: 0, scanned_games: 0 };
  }

  const { data, error } = await adminClient.rpc("settle_finished_games_atomic", {
    p_finished_games: finishedGames,
  });

  if (error) throw error;

  return {
    settled: data?.settled || 0,
    credited_users: data?.credited_users || 0,
    scanned_games: finishedGames.length,
  };
}

async function runAtomicSettlementForGame(gameId) {
  const game = await fetchFinishedWinnerForGame(gameId);
  if (!game) {
    return { settled: 0, credited_users: 0, scanned_games: 0 };
  }

  const { data, error } = await adminClient.rpc("settle_finished_games_atomic", {
    p_finished_games: [game],
  });

  if (error) throw error;

  return {
    settled: data?.settled || 0,
    credited_users: data?.credited_users || 0,
    scanned_games: 1,
  };
}

module.exports = {
  runAtomicSettlement,
  runAtomicSettlementForGame,
  fetchFinishedGameWinners,
  fetchFinishedWinnerForGame,
};
