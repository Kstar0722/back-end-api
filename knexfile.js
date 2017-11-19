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
      name: process.env.RDS_DB_NAME,
      user: process.env.RDS_USERNAME,
      pass: process.env.RDS_PASSWORD
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
