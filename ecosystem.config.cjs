const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env.local") });

module.exports = {
  apps: [
    {
      name: "blockmec-qr",
      script: "node",
      args: ".next/standalone/server.js",
      cwd: "/var/www/Blocmec",
      env: {
        ...process.env,
        NODE_ENV: "production",
        PORT: "3000",
      },
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      exp_backoff_restart_delay: 200,
      out_file: "/var/log/blockmec-qr/out.log",
      error_file: "/var/log/blockmec-qr/error.log",
      merge_logs: true,
      time: true,
    },
  ],
};
