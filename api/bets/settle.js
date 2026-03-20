import { adminClient, requireAuth } from "../_lib/supabase.js";
import { runAtomicSettlement } from "../_lib/settlement.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const settlement = await runAtomicSettlement();

    const { data: profile } = await adminClient
      .from("profiles")
      .select("nba_bucks")
      .eq("user_id", user.id)
      .single();

    return res.status(200).json({
      settled: settlement.settled,
      creditedUsers: settlement.credited_users,
      scannedGames: settlement.scanned_games,
      newBalance: profile?.nba_bucks,
    });
  } catch (err) {
    console.error("[api/bets/settle]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
