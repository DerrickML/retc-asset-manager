module.exports = {
  apps: [
    {
      name: 'retc-asset-manager',
      cwd: '/var/www/retc/assets',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3002',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
