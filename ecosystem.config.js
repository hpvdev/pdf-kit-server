module.exports = {
  apps: [
    {
      name: 'pdf-kit-server',
      script: 'dist/main.js',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster',
      
      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        LOG_LEVEL: 'debug',
      },
      
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        LOG_LEVEL: 'info',
        MAX_FILE_SIZE_MB: 100,
        MAX_CONCURRENT_CONVERSIONS: 3,
        MEMORY_THRESHOLD_PERCENT: 85,
        CONVERSION_TIMEOUT_SECONDS: 30,
      },
      
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
        LOG_LEVEL: 'debug',
        MAX_FILE_SIZE_MB: 50,
        MAX_CONCURRENT_CONVERSIONS: 2,
        MEMORY_THRESHOLD_PERCENT: 80,
        CONVERSION_TIMEOUT_SECONDS: 20,
      },
      
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Process management
      autorestart: true,
      watch: false, // Disable in production
      max_memory_restart: '1G',
      restart_delay: 4000,
      
      // Health monitoring
      min_uptime: '10s',
      max_restarts: 10,
      
      // Advanced PM2 features
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Graceful shutdown
      shutdown_with_message: true,
      
      // Source map support for better error tracking
      source_map_support: true,
      
      // Merge logs from all instances
      merge_logs: true,
      
      // Time zone
      time: true,
      
      // Instance variables for load balancing
      instance_var: 'INSTANCE_ID',
      
      // Custom startup script for health checks
      post_update: ['npm run build'],
      
      // Monitoring
      pmx: true,
      
      // Advanced options
      vizion: false, // Disable git metadata
      automation: false, // Disable keymetrics
      
      // Memory and CPU limits
      max_memory_restart: '1G',
      
      // Error handling
      exp_backoff_restart_delay: 100,
      
      // Custom environment for different deployment scenarios
      env_docker: {
        NODE_ENV: 'production',
        PORT: 3000,
        LOG_LEVEL: 'info',
        DOCKER_MODE: 'true',
        MAX_FILE_SIZE_MB: 100,
        MAX_CONCURRENT_CONVERSIONS: 3,
        MEMORY_THRESHOLD_PERCENT: 85,
        CONVERSION_TIMEOUT_SECONDS: 30,
      },
      
      // Health check configuration
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['production-server-1', 'production-server-2'],
      ref: 'origin/main',
      repo: 'git@github.com:your-org/pdf-kit-server.git',
      path: '/var/www/pdf-kit-server',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update && apt install git -y',
      'post-setup': 'ls -la',
      ssh_options: 'StrictHostKeyChecking=no',
    },
    
    staging: {
      user: 'deploy',
      host: 'staging-server',
      ref: 'origin/develop',
      repo: 'git@github.com:your-org/pdf-kit-server.git',
      path: '/var/www/pdf-kit-server-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': 'apt update && apt install git -y',
      ssh_options: 'StrictHostKeyChecking=no',
    }
  },
  
  // PM2+ monitoring configuration
  module_conf: {
    'pm2-server-monit': {
      port: 43554,
    }
  }
};
