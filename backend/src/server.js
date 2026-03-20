const app = require("./app");
const { port, enableSettlementJob, settlementIntervalMs } = require("./config");
const { startSettlementJob } = require("./jobs/settlementJob");

let stopSettlementJob = null;

app.listen(port, () => {
  console.log(`[server] Backend running on http://localhost:${port}`);

  if (enableSettlementJob) {
    stopSettlementJob = startSettlementJob({ intervalMs: settlementIntervalMs });
  }
});

process.on("SIGINT", () => {
  if (stopSettlementJob) stopSettlementJob();
  process.exit(0);
});

process.on("SIGTERM", () => {
  if (stopSettlementJob) stopSettlementJob();
  process.exit(0);
});
