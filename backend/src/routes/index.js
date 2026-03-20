const health = require("./health");
const me = require("./me");
const profile = require("./profile");
const bets = require("./bets");
const shop = require("./shop");
const reports = require("./reports");
const moderation = require("./moderation");
const games = require("./games");
const content = require("./content");

module.exports = (app) => {
  // Health check
  app.use("/health", health);
  app.use("/api/me", me);
  app.use("/api/profile", profile);
  app.use("/api/bets", bets);
  app.use("/api/shop", shop);
  app.use("/api/reports", reports);
  app.use("/api/moderation", moderation);
  app.use("/api/nba-scores", games);
  app.use("/api/moderate", content);
};
