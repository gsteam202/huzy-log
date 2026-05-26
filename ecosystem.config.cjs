module.exports = {
  apps: [
    {
      name: "huzy-log-web",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "huzy-log-collector",
      script: "scripts/collect-pm2-logs.mjs",
      args: "--watch",
      autorestart: true,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
