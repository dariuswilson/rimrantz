const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const { adminClient } = require("../services/supabase");
const { badRequest, conflict, serverError } = require("../lib/errors");
const { write } = require("../middleware/rateLimiter");
const { containsBlockedTerm } = require("../lib/blocklist");
const router = Router();

// POST /api/profile/username
// Replaces the raw fetch calls in UsernameSetup.jsx
// Validates username server-side, checks uniqueness via SDK (parameterized — no injection risk),
// creates profile, and awards first-100 badge if applicable
router.post("/username", requireAuth, write, async (req, res) => {
  const { username } = req.body;
  const userId = req.user.id;

  if (!username || typeof username !== "string")
    return badRequest(res, "Username is required");

  const trimmed = username.trim();
  if (trimmed.length < 3)
    return badRequest(res, "Username must be at least 3 characters");
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed))
    return badRequest(res, "Only letters, numbers, and underscores");
  if (containsBlockedTerm(trimmed))
    return badRequest(res, "That username is not allowed");

  const normalized = trimmed.toLowerCase();

  try {
    // Check uniqueness — SDK call is parameterized, safe from injection
    const { data: existing } = await adminClient
      .from("profiles")
      .select("username")
      .ilike("username", normalized)
      .maybeSingle();

    if (existing) return conflict(res, "Username is already taken");

    const { error: insertError } = await adminClient
      .from("profiles")
      .insert({ user_id: userId, username: normalized });

    if (insertError) {
      // Unique constraint race — two requests passed the check simultaneously
      if (insertError.code === "23505")
        return conflict(res, "Username is already taken");
      throw insertError;
    }

    // Award first_100 badge — best effort, non-critical
    const { count } = await adminClient
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (count !== null && count <= 100) {
      try {
        await adminClient
          .from("user_badges")
          .insert({ user_id: userId, badge_key: "first_100" });
      } catch {
        // Ignore — badge may already exist
      }
    }

    res.status(201).json({ username: normalized });
  } catch (err) {
    console.error("[profile/username]", err);
    serverError(res);
  }
});

module.exports = router;
