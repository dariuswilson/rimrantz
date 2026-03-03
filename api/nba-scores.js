export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=30");

  try {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const response = await fetch(
      `https://www.balldontlie.io/api/v1/games?dates[]=${dateStr}&per_page=30`,
    );

    const text = await response.text();
    console.log("balldontlie response:", text.slice(0, 500));

    const data = JSON.parse(text);

    if (!data.data) {
      return res.status(200).json({ games: [], debug: data });
    }

    const games = data.data.map((game) => ({
      id: String(game.id),
      status:
        game.status === "Final"
          ? "closed"
          : game.status === "In Progress"
            ? "inprogress"
            : "scheduled",
      start_time: game.date,
      home: game.home_team.abbreviation,
      away: game.visitor_team.abbreviation,
      teams: {
        [game.home_team.abbreviation]: {
          name: game.home_team.full_name,
          abbreviation: game.home_team.abbreviation,
        },
        [game.visitor_team.abbreviation]: {
          name: game.visitor_team.full_name,
          abbreviation: game.visitor_team.abbreviation,
        },
      },
      score: {
        [game.home_team.abbreviation]: game.home_team_score,
        [game.visitor_team.abbreviation]: game.visitor_team_score,
      },
    }));

    res.status(200).json({ games });
  } catch (error) {
    res.status(500).json({ error: error.message, games: [] });
  }
}
