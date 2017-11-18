'use strict';

let express = require('express'),
    router = express.Router(),
    bcrypt = require('bcrypt'),
    jwt = require('jsonwebtoken'),
    _ = require('underscore');

// POST /
router.post('/', (req, res) => {
	req.app.get('db').one(req.app.get('queries').users.findOne, {
    	email: req.body.email
    }).then((user) => {
    	bcrypt.compare(req.body.password, user.password, (err, matches) => {
    		if(err) {
    			return res.status(500).json({
                    error: {
                        message: 'Server error occurred'
                    }
                });
    		}
    		if(matches) {
    			user = _.omit(user, 'password');
    			return res.json({
    				key: jwt.sign(user, 'secret'),
    				user: user
    			});
    		} else {
    			return res.status(401).json({
    				message: 'Incorrect credentials'
    			});
    		}
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