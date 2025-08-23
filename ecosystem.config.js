module.exports = {
  apps: [
    {
      name: 'retc-asset-manager',
      cwd: '/var/www/retc-asset-manager',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      }
    }
  ]
}
