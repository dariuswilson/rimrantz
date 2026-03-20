const { runAtomicSettlement } = require("../services/settlement");

function startSettlementJob({ intervalMs = 60_000 } = {}) {
  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const result = await runAtomicSettlement();
      if (result.settled > 0) {
        console.log("[settlement-job] settled", result);
      }
    } catch (err) {
      console.error("[settlement-job] failed", err);
    } finally {
      running = false;
    }
  };

  // Run once shortly after boot, then continue on interval.
  setTimeout(tick, 3_000);
  const timer = setInterval(tick, intervalMs);

  console.log(`[settlement-job] started (every ${intervalMs}ms)`);

  return () => clearInterval(timer);
}

module.exports = { startSettlementJob };
