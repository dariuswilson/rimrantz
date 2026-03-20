const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const { adminClient } = require("../services/supabase");
const { badRequest, forbidden, serverError } = require("../lib/errors");
const { write } = require("../middleware/rateLimiter");
const { runAtomicSettlement } = require("../services/settlement");
const router = Router();

// POST /api/bets
// Atomic placement via SQL function + idempotency key support.
router.post("/", requireAuth, write, async (req, res) => {
  const { game, teamPicked, amount, odds, payout } = req.body;
  const userId = req.user.id;
  const rawIdempotencyKey = req.headers["idempotency-key"];
  const idempotencyKey =
    typeof rawIdempotencyKey === "string"
      ? rawIdempotencyKey.slice(0, 128)
      : null;

  if (!game?.id || !teamPicked || amount === undefined || odds === undefined || payout === undefined)
    return badRequest(res, "Missing required fields");

  const numAmount = parseInt(amount);
  if (isNaN(numAmount) || numAmount < 10)
    return badRequest(res, "Minimum bet is 10 bucks");

  if (isNaN(parseFloat(odds)) || isNaN(parseFloat(payout)))
    return badRequest(res, "Invalid odds or payout");

  try {
    const gameLabel = game.teams
      ? `${game.teams[game.away]?.name} @ ${game.teams[game.home]?.name}`
      : game.id;

    const { data, error } = await adminClient.rpc("place_bet_atomic", {
      p_user_id: userId,
      p_game_id: String(game.id),
      p_game_label: gameLabel,
      p_team_picked: String(teamPicked),
      p_amount: numAmount,
      p_odds: parseInt(odds),
      p_payout: parseInt(payout),
      p_idempotency_key: idempotencyKey,
    });

    if (error) {
      const message = String(error.message || "");
      if (message.includes("INSUFFICIENT_BALANCE"))
        return forbidden(res, "Insufficient balance");
      if (message.includes("PROFILE_NOT_FOUND"))
        return res.status(404).json({ error: "Profile not found for this user" });
      if (message.includes("INVALID_ODDS") || message.includes("INVALID_PAYOUT"))
        return badRequest(res, "Invalid odds or payout");
      if (message.includes("MIN_BET_10"))
        return badRequest(res, "Minimum bet is 10 bucks");

      console.error("[bets/place] rpc error", error);
      return serverError(res, "Atomic bet placement failed");
    }

    res.status(data?.idempotent ? 200 : 201).json({
      newBalance: data?.new_balance,
      idempotent: !!data?.idempotent,
      status: data?.status || "pending",
    });
  } catch (err) {
    console.error("[bets/place]", err);
    serverError(res);
  }
});

// POST /api/bets/settle
// Triggers atomic settlement pass and returns caller's latest balance.
router.post("/settle", requireAuth, async (req, res) => {
  const userId = req.user.id;

  try {
    const settlement = await runAtomicSettlement();

    const { data: profile } = await adminClient
      .from("profiles")
      .select("nba_bucks")
      .eq("user_id", userId)
      .single();

    res.json({
      settled: settlement.settled,
      creditedUsers: settlement.credited_users,
      scannedGames: settlement.scanned_games,
      newBalance: profile?.nba_bucks,
    });
  } catch (err) {
    console.error("[bets/settle]", err);
    serverError(res);
  }
});

module.exports = router;
