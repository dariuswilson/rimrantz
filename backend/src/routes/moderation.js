const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const { adminClient } = require("../services/supabase");
const { badRequest, forbidden, serverError } = require("../lib/errors");
const { moderate: moderateLimit } = require("../middleware/rateLimiter");
const router = Router();

const VALID_ACTIONS = ["delete_content", "shadowban", "strike", "ban", "dismiss"];

// Middleware: verify the calling user is a moderator
async function requireModerator(req, res, next) {
  const { data } = await adminClient
    .from("moderators")
    .select("user_id")
    .eq("user_id", req.user.id)
    .maybeSingle();

  if (!data) return forbidden(res, "Not a moderator");
  next();
}

// POST /api/moderation/action
// Replaces takeAction() in ModeratorPanel.jsx
// Enforces moderator role server-side so the check can't be bypassed on the client
// TODO: Wrap all writes in a single Postgres transaction once RPC functions are added
router.post("/action", requireAuth, requireModerator, moderateLimit, async (req, res) => {
  const { reportId, action, reportedUserId, contentType, contentId } = req.body;

  if (!action || !VALID_ACTIONS.includes(action))
    return badRequest(res, "Invalid action");

  try {
    if (action === "delete_content") {
      if (contentType === "post") {
        const { error: e1 } = await adminClient.from("takes").delete().eq("id", contentId);
        if (e1) await adminClient.from("game_takes").delete().eq("id", contentId);
      } else if (contentType === "comment") {
        const { error: e2 } = await adminClient.from("comments").delete().eq("id", contentId);
        if (e2) await adminClient.from("game_take_comments").delete().eq("id", contentId);
      } else if (contentType === "group_message") {
        await adminClient.from("messages").delete().eq("id", contentId);
      }
    } else if (action === "shadowban") {
      await adminClient
        .from("profiles")
        .update({ is_shadowbanned: true })
        .eq("user_id", reportedUserId);
    } else if (action === "strike") {
      // TODO: Replace with atomic RPC: increment_strike(user_id)
      // Two simultaneous strikes can still race here — needs a Postgres function
      const { data: profile } = await adminClient
        .from("profiles")
        .select("strike_count")
        .eq("user_id", reportedUserId)
        .single();

      const newCount = (profile?.strike_count || 0) + 1;
      await adminClient
        .from("profiles")
        .update({
          strike_count: newCount,
          ...(newCount >= 3 ? { is_shadowbanned: true } : {}),
        })
        .eq("user_id", reportedUserId);
    } else if (action === "ban") {
      await adminClient
        .from("profiles")
        .update({ banned: true })
        .eq("user_id", reportedUserId);
    }

    // Update report status (skip if no reportId — e.g. direct action from shadowban list)
    if (reportId) {
      await adminClient
        .from("reports")
        .update({
          status: action === "dismiss" ? "dismissed" : "resolved",
          action_taken: action,
          resolved_by: req.user.id,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", reportId);
    }

    res.json({ success: true, action });
  } catch (err) {
    console.error("[moderation/action]", err);
    serverError(res);
  }
});

// POST /api/moderation/unshadowban
router.post("/unshadowban", requireAuth, requireModerator, moderateLimit, async (req, res) => {
  const { userId } = req.body;
  if (!userId) return badRequest(res, "Missing userId");

  try {
    await adminClient
      .from("profiles")
      .update({ is_shadowbanned: false })
      .eq("user_id", userId);

    res.json({ success: true });
  } catch (err) {
    console.error("[moderation/unshadowban]", err);
    serverError(res);
  }
});

module.exports = router;
