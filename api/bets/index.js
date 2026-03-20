import { adminClient, requireAuth } from "../_lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  const { game, teamPicked, amount, odds, payout } = req.body || {};
  const rawIdempotencyKey = req.headers["idempotency-key"];
  const idempotencyKey =
    typeof rawIdempotencyKey === "string" ? rawIdempotencyKey.slice(0, 128) : null;

  if (!game?.id || !teamPicked || amount === undefined || odds === undefined || payout === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const numAmount = parseInt(amount, 10);
  const numOdds = parseInt(odds, 10);
  const numPayout = parseInt(payout, 10);

  if (Number.isNaN(numAmount) || numAmount < 10) {
    return res.status(400).json({ error: "Minimum bet is 10 bucks" });
  }

  if (Number.isNaN(numOdds) || numOdds === 0 || Number.isNaN(numPayout) || numPayout <= 0) {
    return res.status(400).json({ error: "Invalid odds or payout" });
  }

  try {
    const gameLabel = game.teams
      ? `${game.teams[game.away]?.name} @ ${game.teams[game.home]?.name}`
      : String(game.id);

    const { data, error } = await adminClient.rpc("place_bet_atomic", {
      p_user_id: user.id,
      p_game_id: String(game.id),
      p_game_label: gameLabel,
      p_team_picked: String(teamPicked),
      p_amount: numAmount,
      p_odds: numOdds,
      p_payout: numPayout,
      p_idempotency_key: idempotencyKey,
    });

    if (error) {
      const message = String(error.message || "");
      if (message.includes("INSUFFICIENT_BALANCE")) {
        return res.status(403).json({ error: "Insufficient balance" });
      }
      if (message.includes("PROFILE_NOT_FOUND")) {
        return res.status(404).json({ error: "Profile not found for this user" });
      }
      if (
        message.includes("INVALID_ODDS") ||
        message.includes("INVALID_PAYOUT") ||
        message.includes("MIN_BET_10")
      ) {
        return res.status(400).json({ error: "Invalid odds or payout" });
      }

      console.error("[api/bets] rpc error", error);
      return res.status(500).json({ error: "Atomic bet placement failed" });
    }

    return res.status(data?.idempotent ? 200 : 201).json({
      newBalance: data?.new_balance,
      idempotent: !!data?.idempotent,
      status: data?.status || "pending",
    });
  } catch (err) {
    console.error("[api/bets]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
