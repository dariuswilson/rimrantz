import { supabase } from "../supabase";

export const calcOdds = (winProbability) => {
  if (!winProbability || winProbability <= 0 || winProbability >= 100) return 0;
  const p = parseFloat(winProbability);
  if (p >= 50) {
    return -Math.round((p / (100 - p)) * 100);
  } else {
    return Math.round(((100 - p) / p) * 100);
  }
};

export const placeBet = async (
  userId,
  game,
  teamPicked,
  amount,
  odds,
  payout,
) => {
  const gameLabel = `${game.teams[game.away]?.name} @ ${game.teams[game.home]?.name}`;

  const { error: betError } = await supabase.from("predictions").insert({
    user_id: userId,
    game_id: game.id,
    game_label: gameLabel,
    team_picked: teamPicked,
    amount,
    odds,
    payout,
    status: "pending",
  });

  if (betError) throw betError;

  const { data: profile } = await supabase
    .from("profiles")
    .select("nba_bucks")
    .eq("user_id", userId)
    .single();

  const { error: bucksError } = await supabase
    .from("profiles")
    .update({ nba_bucks: (profile?.nba_bucks || 0) - amount })
    .eq("user_id", userId);

  if (bucksError) throw bucksError;
};

export const settlePredictions = async (userId, games, onBucksUpdate) => {
  const { data: pending } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .is("settled_at", null);

  if (!pending || pending.length === 0) return;

  const finishedGames = games.filter((g) => g.status === "closed");
  const finishedIds = new Set(finishedGames.map((g) => g.id));

  let totalWinnings = 0;

  const ABBR_MAP = {
    // Non-standard → Standard
    GS: "GSW",
    SA: "SAS",
    NO: "NOP",
    WSH: "WAS",
    NY: "NYK",
    UTAH: "UTA",
    BRK: "BKN",
    CHO: "CHA",
    // Standard → Standard (identity mappings, just to be safe)
    ATL: "ATL",
    BOS: "BOS",
    BKN: "BKN",
    CHA: "CHA",
    CHI: "CHI",
    CLE: "CLE",
    DAL: "DAL",
    DEN: "DEN",
    DET: "DET",
    GSW: "GSW",
    HOU: "HOU",
    IND: "IND",
    LAC: "LAC",
    LAL: "LAL",
    MEM: "MEM",
    MIA: "MIA",
    MIL: "MIL",
    MIN: "MIN",
    NOP: "NOP",
    NYK: "NYK",
    OKC: "OKC",
    ORL: "ORL",
    PHI: "PHI",
    PHX: "PHX",
    POR: "POR",
    SAC: "SAC",
    SAS: "SAS",
    TOR: "TOR",
    UTA: "UTA",
    WAS: "WAS",
  };
  const normalize = (t) => ABBR_MAP[t] || t;

  for (const pred of pending) {
    if (!finishedIds.has(pred.game_id)) continue;

    const game = finishedGames.find((g) => g.id === pred.game_id);
    if (!game) continue;

    const homeScore = game.score[game.home];
    const awayScore = game.score[game.away];
    const winner = homeScore > awayScore ? game.home : game.away;
    const won = normalize(winner) === normalize(pred.team_picked);

    await supabase
      .from("predictions")
      .update({
        status: won ? "won" : "lost",
        settled_at: new Date().toISOString(),
      })
      .eq("id", pred.id);

    if (won) totalWinnings += pred.payout;
  }

  if (totalWinnings > 0) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nba_bucks")
      .eq("user_id", userId)
      .single();

    const newBalance = (profile?.nba_bucks || 0) + totalWinnings;
    await supabase
      .from("profiles")
      .update({ nba_bucks: newBalance })
      .eq("user_id", userId);

    if (onBucksUpdate) onBucksUpdate(newBalance);
  }
};
