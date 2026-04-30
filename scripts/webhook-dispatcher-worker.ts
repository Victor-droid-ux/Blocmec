// scripts/webhook-dispatcher-worker.ts

import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const pollMs = Math.max(
  1000,
  Number.parseInt(process.env.WEBHOOK_WORKER_POLL_MS ?? "5000", 10) || 5000,
);
const defaultLimit = Math.max(
  1,
  Math.min(
    100,
    Number.parseInt(process.env.WEBHOOK_WORKER_BATCH_LIMIT ?? "20", 10) || 20,
  ),
);

let shuttingDown = false;
let dispatchPendingWebhookJobsRef: typeof import("../lib/webhooks").dispatchPendingWebhookJobs | null = null;

async function getDispatchPendingWebhookJobs() {
  if (dispatchPendingWebhookJobsRef) return dispatchPendingWebhookJobsRef;
  const mod = await import("../lib/webhooks");
  dispatchPendingWebhookJobsRef = mod.dispatchPendingWebhookJobs;
  return dispatchPendingWebhookJobsRef;
}

function log(message: string, meta?: Record<string, unknown>) {
  const prefix = `[webhook-worker ${new Date().toISOString()}]`;
  if (meta) {
    console.log(prefix, message, meta);
  } else {
    console.log(prefix, message);
  }
}

async function runOnce(limit: number) {
  const dispatchPendingWebhookJobs = await getDispatchPendingWebhookJobs();
  const result = await dispatchPendingWebhookJobs(limit);
  log("dispatch cycle complete", result);
  return result;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const once = args.has("--once");

  process.on("SIGTERM", () => {
    shuttingDown = true;
    log("received SIGTERM, shutting down");
  });

  process.on("SIGINT", () => {
    shuttingDown = true;
    log("received SIGINT, shutting down");
  });

  if (once) {
    await runOnce(defaultLimit);
    return;
  }

  log("worker started", { pollMs, defaultLimit });

  while (!shuttingDown) {
    try {
      await runOnce(defaultLimit);
    } catch (error: any) {
      log("dispatch cycle failed", {
        error: error?.message ?? "unknown error",
      });
    }

    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }

  log("worker stopped");
}

main().catch((error) => {
  log("worker crashed", { error: error?.message ?? "unknown error" });
  process.exit(1);
});
