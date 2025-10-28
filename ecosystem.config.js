module.exports = {
  apps: [
    {
      name: 'retc-asset-management-portal',
      cwd: '/srv/retc-asset-manager',
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
