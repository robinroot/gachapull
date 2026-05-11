/**
 * PM2 Ecosystem Config
 * Usage: pm2 start ecosystem.config.cjs
 */
module.exports = {
  apps: [
    {
      name: "gachapull-api",
      script: "./artifacts/api-server/dist/index.mjs",
      interpreter: "node",
      cwd: "/var/www/gachapull",
      instances: 1,
      exec_mode: "fork",
      node_args: "--env-file=/var/www/gachapull/.env",
      env: {
        NODE_ENV: "production",
        PORT: 8080,
      },
      error_file: "/var/log/pm2/gachapull-error.log",
      out_file: "/var/log/pm2/gachapull-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      restart_delay: 5000,
      max_restarts: 10,
      watch: false,
    },
  ],
};
