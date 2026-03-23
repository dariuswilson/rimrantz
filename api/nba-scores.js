export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=20");

  try {
    const response = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
    );

    const data = await response.json();

    const games =
      data.events?.map((event) => {
        const comp = event.competitions[0];
        const home = comp.competitors.find((t) => t.homeAway === "home");
        const away = comp.competitors.find((t) => t.homeAway === "away");
        const statusType = event.status?.type || {};
        const compStatusType = comp.status?.type || {};

        const statusName = statusType.name || "";
        const statusState = statusType.state || compStatusType.state || "";
        const clock = event.status?.displayClock || comp.status?.displayClock || "";
        const period = Number(event.status?.period ?? comp.status?.period ?? 0);
        const isCompleted =
          Boolean(statusType.completed) || Boolean(compStatusType.completed);

        // ESPN occasionally exposes inconsistent `name`; derive a robust app status.
        const isLikelyLiveFromPeriod = period > 0 && !isCompleted;
        const normalizedStatus = isCompleted
          ? "closed"
          : statusState === "in" || statusName === "STATUS_IN_PROGRESS" || isLikelyLiveFromPeriod
            ? "inprogress"
            : "scheduled";

        // Build win probabilities
        let homeWinPct = null;
        let awayWinPct = null;

        // 1. Try predictor (available live and close to tipoff)
        if (comp.predictor) {
          homeWinPct = comp.predictor.homeTeam?.gameProjection || null;
          awayWinPct = comp.predictor.awayTeam?.gameProjection || null;
        }

        // 2. Fall back to last play probability if live
        if (!homeWinPct && comp.situation?.lastPlay?.probability) {
          const prob = comp.situation.lastPlay.probability;
          homeWinPct = (prob.homeWinPercentage || 0) * 100;
          awayWinPct = (prob.awayWinPercentage || 0) * 100;
        }

        // 3. Fall back to pregame spread odds for scheduled games
        if (!homeWinPct && comp.odds?.[0]) {
          const spread = parseFloat(comp.odds[0].spread) || 0;
          // Each point of spread ~2.8% shift from 50%
          const spreadProb = 50 + spread * -1 * 2.8;
          homeWinPct = Math.min(85, Math.max(15, spreadProb));
          awayWinPct = 100 - homeWinPct;
        }

        console.log(
          event.id,
          home.team.abbreviation,
          "vs",
          away.team.abbreviation,
          "status:",
          statusName,
          "state:",
          statusState,
          "normalized:",
          normalizedStatus,
          "clock:",
          clock,
          "period:",
          period,
          "detail:",
          event.status.type.detail,
          "shortDetail:",
          event.status.type.shortDetail,
          "homeWinPct:",
          homeWinPct,
          "awayWinPct:",
          awayWinPct,
        );

        return {
          id: event.id,
          status: normalizedStatus,
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

    res.status(200).json({ games });
  } catch (error) {
    res.status(500).json({ error: error.message, games: [] });
  }
}
