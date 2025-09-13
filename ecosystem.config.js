module.exports = {
  apps: [
    {
      name: 'airdrop',
      script: 'server.js',
      exec_mode: 'fork',
      instances: 1,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};

