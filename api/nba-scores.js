export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=30");

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
          clock: event.status.displayClock,
          period: event.status.period,
        };
      }) || [];

    res.status(200).json({ games });
  } catch (error) {
    res.status(500).json({ error: error.message, games: [] });
  }
}
