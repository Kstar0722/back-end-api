'use strict';

let express = require('express'),
    router = express.Router(),
    bcrypt = require('bcrypt'),
    path = require('path'),
    _ = require('underscore');

// POST /, /create
router.post(['/', '/create'], (req, res) => {
	bcrypt.hash(req.body.password, 12, (err, hash) => {
		if(err) {
			return res.status(500).json({});
		}
		req.app.get('db').one('INSERT INTO users (email, password, first_name, last_name, permission) VALUES (${email}, ${password}, ${first_name}, ${last_name}, ${permission}) RETURNING email, first_name, last_name, permission;', _.extend(req.body, {
	    	password: hash,
	    	permission: 0
	    })).then((user) => {
	    	return res.status(201).json({
	    		user: user
	    	});
	    }).catch((err) => {
	    	return res.status(500).json({});
	    });
	});
});

// PUT /, /edit
router.put(['/', '/edit'], function(req, res) {
	let query = _.map(req.body, (val, key) => {
	    return `${key} = ` + '${' + key + '}'
	}).join(', ');
	req.app.get('db').one('UPDATE users SET ' + query + ' WHERE id = ${id} RETURNING email, password, first_name, last_name, permission;', _.extend(req.body, {
		id: req.user.id
	})).then((user) => {
		return res.json({
			user: user
		});
	}).catch(() => {
		return res.status(500).json({});
	});
});

// GET /current
router.get('/current', function(req, res) {
	req.app.get('db').one('SELECT email, first_name, last_name, permission FROM users WHERE id = ${id} LIMIT 1;', {
    	id: req.user.id
    }).then((user) => {
    	return res.json(user);
    }).catch((err) => {
    	return res.status(500).json({});
    });
});

module.exports = router;
