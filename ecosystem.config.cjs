const path = require("path");
const dotenv = require("dotenv");
const appLogDir = process.env.BLOCKMEC_LOG_DIR || "/home/blockmec/logs/blockmec-qr";

dotenv.config({ path: path.join(__dirname, ".env.local") });

module.exports = {
  apps: [
    {
      name: "blockmec-qr",
      script: "node",
      args: ".next/standalone/server.js",
      cwd: process.env.BLOCKMEC_APP_DIR || "/home/blockmec/Blockmec",
      env: {
        ...process.env,
        NODE_ENV: "production",
        PORT: "3000",
      },
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      exp_backoff_restart_delay: 200,
      out_file: `${appLogDir}/out.log`,
      error_file: `${appLogDir}/error.log`,
      merge_logs: true,
      time: true,
    },
  ],
};
