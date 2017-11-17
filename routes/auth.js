'use strict';

let express = require('express'),
    router = express.Router(),
    bcrypt = require('bcrypt'),
    jwt = require('jsonwebtoken'),
    _ = require('underscore');

// POST /
router.post('/', function(req, res) {
	req.app.get('db').one('SELECT * FROM users WHERE email = ${email} LIMIT 1;', {
    	email: req.body.email
    }).then((user) => {
    	bcrypt.compare(req.body.password, user.password, function(err, matches) {
    		if(err) {
    			console.log(err);
    			return res.status(500).json({});
    		}
    		if(matches) {
    			user = _.omit(user, 'password');
    			return res.json({
    				key: jwt.sign(user, 'secret'),
    				user: user
    			});
    		} else {
    			return res.status(401).json({
    				message: 'Unauthorized'
    			});
    		}
    	});
    }).catch((err) => {
    	return res.status(500).json({});
    });
});

module.exports = router;