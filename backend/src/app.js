const express = require("express");
const cors = require("cors");
const { frontendUrl } = require("./config");
const { general } = require("./middleware/rateLimiter");
const registerRoutes = require("./routes");

const app = express();

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));

// Basic security headers
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

// General rate limit applied to all routes
app.use(general);

registerRoutes(app);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("[error]", err);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
