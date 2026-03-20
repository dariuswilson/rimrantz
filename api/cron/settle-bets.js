import { runAtomicSettlement } from "../_lib/settlement.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  // For Vercel Cron, set CRON_SECRET in project env and Vercel will send it as Bearer token.
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const settlement = await runAtomicSettlement();
    return res.status(200).json({ ok: true, ...settlement });
  } catch (err) {
    console.error("[api/cron/settle-bets]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
