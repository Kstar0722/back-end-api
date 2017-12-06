'use strict';

let config = {
  development: {
    token_secret: 'secret',
    domain: 'localhost:3000',
    dashboard_url: 'dashboard',
    reset_password_url: 'dashboard/reset_password',
    s3_region: 'us-west-2',
    s3_bucket: 'iifym-blueprints',
  },
  production: {
    token_secret: process.env.TOKEN_SECRET,
    domain: process.env.DOMAIN || 'iifym-dashboard.s3-website-us-west-2.amazonaws.com', // iifym.com
    dashboard_url: process.env.DASHBOARD || 'dashboard', 
    reset_password_url: process.env.RESET_PASSWORD || 'dashboard/reset_password',
    s3_region: process.env.S3_REGION || 'us-west-2',
    s3_bucket: process.env.S3_BUCKET || 'iifym-blueprints',
  }
};

module.exports = config[process.env.NODE_ENV || 'development'];
