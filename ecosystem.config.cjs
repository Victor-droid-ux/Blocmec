module.exports = {
  apps: [
    {
      name: "blockmec-qr",
      script: "npm",
      args: "run start",
      cwd: "/var/www/blockmec-qr-code",
      env: {
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
