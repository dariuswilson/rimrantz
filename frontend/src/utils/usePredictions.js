import { supabase } from "../supabase";

const requireBackendBets =
  String(import.meta.env.VITE_REQUIRE_BACKEND_BETS || "false").toLowerCase() ===
  "true";

export const calcOdds = (winProbability) => {
  const parsed = Number(winProbability);
  if (!Number.isFinite(parsed)) return 100;

  // Clamp away from 0 and 100 to avoid divide-by-zero and Infinity odds.
  const p = Math.min(99, Math.max(1, parsed));
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
  idempotencyKey,
) => {
  const { data: authData } = await supabase.auth.getSession();
  const accessToken = authData?.session?.access_token;

  if (accessToken) {
    try {
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
        },
        body: JSON.stringify({ game, teamPicked, amount, odds, payout }),
      });

      if (res.ok) return;
      if (requireBackendBets) {
        const body = await res.json().catch(() => ({}));
        const message =
          body?.error ||
          `Backend bet placement failed (HTTP ${res.status})`;
        throw new Error(message);
      }
      // If backend endpoint is unavailable/not deployed yet, fall back to legacy flow.
    } catch (err) {
      if (requireBackendBets) {
        if (err instanceof Error) throw err;
        throw new Error("Backend bet placement unavailable");
      }
      // Network/backend errors fall back to legacy flow.
    }
  }

  if (requireBackendBets) {
    throw new Error("No auth token for backend bet placement");
  }

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
