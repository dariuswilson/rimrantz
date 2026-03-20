const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const { adminClient } = require("../services/supabase");
const { serverError } = require("../lib/errors");
const router = Router();

// GET /api/me/bootstrap
// Replaces the 3 separate DB fetches in App.jsx init()
// Returns profile, isModerator, and unreadCount in a single round trip
// Frontend migration: replace fetchProfile + fetchModerator + fetchUnreadCount with one call here
router.get("/bootstrap", requireAuth, async (req, res) => {
  const userId = req.user.id;

  try {
    const [
      { data: profile },
      { data: moderatorRow },
      { count: unreadCount },
    ] = await Promise.all([
      adminClient
        .from("profiles")
        .select("username, nba_bucks, banned, avatar_url")
        .eq("user_id", userId)
        .maybeSingle(),
      adminClient
        .from("moderators")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle(),
      adminClient
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", userId)
        .eq("read", false),
    ]);

    if (profile?.banned) {
      return res.status(403).json({ banned: true });
    }

    res.json({
      profile,
      isModerator: !!moderatorRow,
      unreadCount: unreadCount || 0,
    });
  } catch (err) {
    console.error("[me/bootstrap]", err);
    serverError(res);
  }
});

module.exports = router;
