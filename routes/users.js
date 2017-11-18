'use strict';

let express = require('express'),
    router = express.Router(),
    bcrypt = require('bcrypt'),
    path = require('path'),
    _ = require('underscore'),
    validator = require('validator');

// POST /, /create
router.post(['/', '/create'], (req, res) => {
	if(!validator.isEmail(req.body.email)) {
		return res.status(400).json({
			error: {
				message: 'Email must be valid'
			}
		});
	}
	bcrypt.hash(req.body.password, 12, (err, hash) => {
		if(err) {
			return res.status(500).json({
	    		error: {
	    			message: 'Server error occurred'
	    		}
	    	});
		}
		req.app.get('db').one('INSERT INTO users (email, password, first_name, last_name, permission) VALUES (${email}, ${password}, ${first_name}, ${last_name}, ${permission}) RETURNING email, first_name, last_name, permission;', _.extend(req.body, {
	    	password: hash,
	    	permission: 0
	    })).then((user) => {
	    	return res.status(201).json({
	    		user: user
	    	});
	    }).catch((err) => {
	    	return res.status(400).json({
	            error: {
	                message: err.message
	            }
	        });
	    });
	});
});

// PUT /, /edit
router.put(['/', '/edit'], (req, res) => {
	req.body = _.omit(req.body, 'id', 'password', 'permission', 'created_at');
	let updates = _.map(req.body, (val, key) => {
	    return `${key} = ` + '${' + key + '}'
	}).join(', ');
	req.app.get('db').one('UPDATE users SET ' + updates + ' WHERE id = ${id} RETURNING email, password, first_name, last_name, permission;', _.extend(req.body, {
		id: req.user.id
	})).then((user) => {
		return res.json({
			user: user
		});
	}).catch(() => {
		return res.status(500).json({
    		error: {
    			message: 'Server error occurred'
    		}
    	});
	});
});

// GET /current
router.get('/current', (req, res) => {
	req.app.get('db').one('SELECT email, first_name, last_name, permission FROM users WHERE id = ${id} LIMIT 1;', {
    	id: req.user.id
    }).then((user) => {
    	return res.json({
    		user: user
    	});
    }).catch((err) => {
    	return res.status(500).json({
    		error: {
    			message: 'Server error occurred'
    		}
    	});
    });
});

module.exports = router;
