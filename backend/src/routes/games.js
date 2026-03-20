const { Router } = require("express");
const router = Router();

// Simple in-memory cache — matches the 20s Cache-Control in the original Vercel function
let gamesCache = null;
let cacheExpiry = 0;
const CACHE_TTL = 20_000;

// GET /api/nba-scores
// Drop-in replacement for api/nba-scores.js
// Removes the console.log statements and adds in-memory caching
router.get("/", async (_req, res) => {
  const now = Date.now();
  if (gamesCache && now < cacheExpiry) {
    return res.json(gamesCache);
  }

  try {
    const response = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard"
    );
    const data = await response.json();

    const games =
      data.events?.map((event) => {
        const comp = event.competitions[0];
        const home = comp.competitors.find((t) => t.homeAway === "home");
        const away = comp.competitors.find((t) => t.homeAway === "away");
        const status = event.status.type.name;
        const clock = event.status.displayClock;
        const period = event.status.period;

        let homeWinPct = null;
        let awayWinPct = null;

        if (comp.predictor) {
          homeWinPct = comp.predictor.homeTeam?.gameProjection || null;
          awayWinPct = comp.predictor.awayTeam?.gameProjection || null;
        }

        if (!homeWinPct && comp.situation?.lastPlay?.probability) {
          const prob = comp.situation.lastPlay.probability;
          homeWinPct = (prob.homeWinPercentage || 0) * 100;
          awayWinPct = (prob.awayWinPercentage || 0) * 100;
        }

        if (!homeWinPct && comp.odds?.[0]) {
          const spread = parseFloat(comp.odds[0].spread) || 0;
          const spreadProb = 50 + spread * -1 * 2.8;
          homeWinPct = Math.min(85, Math.max(15, spreadProb));
          awayWinPct = 100 - homeWinPct;
        }

        return {
          id: event.id,
          status:
            status === "STATUS_FINAL"
              ? "closed"
              : status === "STATUS_IN_PROGRESS"
                ? "inprogress"
                : "scheduled",
          start_time: event.date,
          home: home.team.abbreviation,
          away: away.team.abbreviation,
          teams: {
            [home.team.abbreviation]: {
              name: home.team.displayName,
              abbreviation: home.team.abbreviation,
            },
            [away.team.abbreviation]: {
              name: away.team.displayName,
              abbreviation: away.team.abbreviation,
            },
          },
          score: {
            [home.team.abbreviation]: parseInt(home.score) || 0,
            [away.team.abbreviation]: parseInt(away.score) || 0,
          },
          clock,
          period,
          statusDetail: event.status.type.detail || "",
          shortDetail: event.status.type.shortDetail || "",
          win_probability:
            homeWinPct && awayWinPct
              ? {
                  [home.team.abbreviation]: Math.round(homeWinPct),
                  [away.team.abbreviation]: Math.round(awayWinPct),
                }
              : null,
        };
      }) || [];

    gamesCache = { games };
    cacheExpiry = now + CACHE_TTL;
    res.json({ games });
  } catch (error) {
    res.status(500).json({ error: error.message, games: [] });
  }
});

module.exports = router;
