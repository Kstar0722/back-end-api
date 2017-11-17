'use strict';

let config = {
	'development': {
		'db': {
			'host': 'localhost',
			'port': 5432,
			'name': 'iifym',
			'user': 'postgres',
			'pass': 'root'
		}
	},
	'production': {
		'db': {
			'host': process.env.RDS_HOSTNAME,
			'port': process.env.RDS_PORT,
			'name': process.env.RDS_DB_NAME,
			'user': process.env.RDS_USERNAME,
			'pass': process.env.RDS_PASSWORD
		}
	}
}

module.exports = process.env.NODE_ENV == 'production' ? config.production : config.development;