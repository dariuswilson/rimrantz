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
        const status = event.status.type.name;
        const clock = event.status.displayClock;
        const period = event.status.period;

        // ESPN provides win probability in the competition
        const winProb = comp.situation?.lastPlay?.probability || null;

        // Try predictor data
        const predictor = comp.predictor || null;
        const homeWinPct =
          predictor?.homeTeam?.gameProjection ||
          winProb?.homeWinPercentage * 100 ||
          null;
        const awayWinPct =
          predictor?.awayTeam?.gameProjection ||
          winProb?.awayWinPercentage * 100 ||
          null;

        // Debug: log status info
        console.log(
          event.id,
          home.team.abbreviation,
          "vs",
          away.team.abbreviation,
          "status:",
          status,
          "clock:",
          clock,
          "period:",
          period,
          "detail:",
          event.status.type.detail,
          "shortDetail:",
          event.status.type.shortDetail,
        );

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

    res.status(200).json({ games });
  } catch (error) {
    res.status(500).json({ error: error.message, games: [] });
  }
}
