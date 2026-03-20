const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const { adminClient } = require("../services/supabase");
const { badRequest, forbidden, conflict, serverError } = require("../lib/errors");
const { write } = require("../middleware/rateLimiter");
const router = Router();

// POST /api/shop/purchase
// Prevents duplicate purchases and enforces balance check on the server
// TODO: Replace the sequential balance deduct + insert with a Postgres RPC for true atomicity
router.post("/purchase", requireAuth, write, async (req, res) => {
  const { itemId, itemName, price } = req.body;
  const userId = req.user.id;

  if (!itemId || !itemName || price === undefined)
    return badRequest(res, "Missing required fields");

  const numPrice = parseInt(price);
  if (isNaN(numPrice) || numPrice < 0)
    return badRequest(res, "Invalid price");

  try {
    // Check if already owned — server enforces this regardless of client state
    const { data: existing } = await adminClient
      .from("shop_purchases")
      .select("item_id")
      .eq("user_id", userId)
      .eq("item_id", itemId)
      .maybeSingle();

    if (existing) return conflict(res, "Item already owned");

    // Fetch authoritative balance — never trust client-provided balance
    const { data: profile } = await adminClient
      .from("profiles")
      .select("nba_bucks")
      .eq("user_id", userId)
      .single();

    if (!profile) return serverError(res, "Profile not found");
    if (profile.nba_bucks < numPrice) return forbidden(res, "Insufficient balance");

    const newBalance = profile.nba_bucks - numPrice;

    // Deduct bucks
    const { error: bucksError } = await adminClient
      .from("profiles")
      .update({ nba_bucks: newBalance })
      .eq("user_id", userId);

    if (bucksError) throw bucksError;

    // Record purchase
    const { error: purchaseError } = await adminClient
      .from("shop_purchases")
      .insert({ user_id: userId, item_id: itemId, item_name: itemName, price: numPrice });

    if (purchaseError) {
      // Attempt to refund bucks if purchase record fails
      await adminClient
        .from("profiles")
        .update({ nba_bucks: profile.nba_bucks })
        .eq("user_id", userId);
      throw purchaseError;
    }

    res.json({ newBalance });
  } catch (err) {
    console.error("[shop/purchase]", err);
    serverError(res);
  }
});

module.exports = router;
