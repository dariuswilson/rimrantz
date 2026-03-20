require("dotenv").config();

const required = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`[config] Missing required env var: ${key}`);
    process.exit(1);
  }
}

module.exports = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  enableSettlementJob:
    String(process.env.ENABLE_SETTLEMENT_JOB || "true").toLowerCase() ===
    "true",
  settlementIntervalMs: parseInt(process.env.SETTLEMENT_INTERVAL_MS || "60000", 10),
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};
