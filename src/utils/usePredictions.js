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

  const { error: bucksError } = await supabase.rpc("increment_nba_bucks", {
    user_id: userId,
    amount: -amount, // negative to deduct
  });

  if (bucksError) throw bucksError;
};

// Note: bet settlement now handled by settle_bets.py in the Discord bot (runs every 5 min)
