const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const { adminClient } = require("../services/supabase");
const { badRequest, serverError } = require("../lib/errors");
const { write } = require("../middleware/rateLimiter");
const router = Router();

const VALID_REASONS = [
  "Spam",
  "Harassment",
  "Hate speech",
  "Inappropriate content",
  "Other",
];

const VALID_CONTENT_TYPES = ["post", "comment", "profile", "group_message"];

// POST /api/reports
// Replaces the direct supabase insert in ReportModal.jsx
// Adds server-side validation, self-report prevention, and reporter username lookup
router.post("/", requireAuth, write, async (req, res) => {
  const {
    reportedUserId,
    reportedUsername,
    contentType,
    contentId,
    contentPreview,
    reason,
  } = req.body;

  const reporter = req.user;

  if (!reason || !VALID_REASONS.includes(reason))
    return badRequest(res, "Invalid reason");
  if (!contentType || !VALID_CONTENT_TYPES.includes(contentType))
    return badRequest(res, "Invalid content type");
  if (!reportedUserId || !contentId)
    return badRequest(res, "Missing required fields");
  if (reporter.id === reportedUserId)
    return badRequest(res, "Cannot report yourself");

  try {
    // Look up reporter's username from DB — don't trust client-provided value
    const { data: reporterProfile } = await adminClient
      .from("profiles")
      .select("username")
      .eq("user_id", reporter.id)
      .maybeSingle();

    const { error } = await adminClient.from("reports").insert({
      reporter_id: reporter.id,
      reporter_username: reporterProfile?.username || "unknown",
      reported_user_id: reportedUserId,
      reported_username: reportedUsername,
      content_type: contentType,
      content_id: contentId,
      content_preview: contentPreview?.slice(0, 300),
      reason,
      status: "pending",
    });

    if (error) throw error;

    res.status(201).json({ message: "Report submitted" });
  } catch (err) {
    console.error("[reports]", err);
    serverError(res);
  }
});

module.exports = router;
