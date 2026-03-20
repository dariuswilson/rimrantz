const rateLimit = require("express-rate-limit");

const opts = (max, message) => ({
  windowMs: 60_000, // 1 minute window
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: message },
});

// Applied to all routes globally
const general = rateLimit(opts(120, "Too many requests, please slow down."));

// Auth endpoints (login, signup)
const auth = rateLimit(opts(10, "Too many auth attempts, please wait."));

// Write endpoints (bets, purchases, posts, comments)
const write = rateLimit(opts(30, "Too many requests, please slow down."));

// Moderator action endpoints
const moderate = rateLimit(opts(20, "Moderation rate limit exceeded."));

// AI content moderation endpoint — limits Anthropic API costs
const contentMod = rateLimit(opts(60, "Content moderation rate limit exceeded."));

module.exports = { general, auth, write, moderate, contentMod };
