'use strict';

let config = require('./config');

module.exports = {
  development: {
    client: 'postgres',
    connection: {
      host: 'localhost',
      user: 'postgres',
      password: 'root',
      database: 'iifym',
      charset: 'utf8'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },
  production: {
    client: 'postgres',
    connection: {
      host: process.env.RDS_HOSTNAME,
      port: process.env.RDS_PORT,
      database: process.env.RDS_DB_NAME,
      user: process.env.RDS_USERNAME,
      password: process.env.RDS_PASSWORD,
      charset: 'utf8'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }
};
