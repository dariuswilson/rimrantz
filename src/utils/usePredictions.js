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

// Note: bet settlement lives in App.jsx > settleUserBets()
// That function handles: settling won/lost, balance updates, and the broke-user safety net (floor of 10 bucks)
