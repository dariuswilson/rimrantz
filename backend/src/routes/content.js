const { Router } = require("express");
const { anthropicApiKey } = require("../config");
const { contentMod } = require("../middleware/rateLimiter");
const router = Router();

// POST /api/moderate
// Drop-in replacement for api/moderate.js
// Adds rate limiting and input length cap to control Anthropic API costs
router.post("/", contentMod, async (req, res) => {
  const text = req.body?.text;
  if (!text) return res.json({ allowed: true });

  // Cap input length — prevents abuse and limits per-request cost
  const safeText = String(text).slice(0, 1000);

  if (!anthropicApiKey) {
    console.warn("[content] ANTHROPIC_API_KEY not set — allowing content");
    return res.json({ allowed: true });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 10,
        messages: [
          {
            role: "user",
            content: `Is this text free of hate speech, slurs, racism, homophobia, sexual content, and extreme toxicity? Reply with only "yes" or "no".\n\nText: "${safeText}"`,
          },
        ],
      }),
    });

    const data = await response.json();
    const result = data.content?.[0]?.text?.trim().toLowerCase();
    return res.json({ allowed: result === "yes" });
  } catch {
    // If moderation fails, allow content — blocklist still runs client-side
    return res.json({ allowed: true });
  }
});

module.exports = router;
