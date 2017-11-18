'use strict';

let express = require('express'),
    router = express.Router(),
    _ = require('underscore');

// POST /, /create
router.post(['/', '/create'], (req, res) => {
    req.body = _.omit(req.body, 'id', 'created_at');
    req.body.customer = req.user.id;
    let keys = Object.keys(req.body).join(', '),
        values = _.map(req.body, (val, key) => {
            return '${' + key + '}';
        }).join(', ');
	req.app.get('db').one(`INSERT INTO results (${keys}) VALUES (${values}) RETURNING *;`, _.extend(req.body)).then((result) => {
    	return res.status(201).json({
    		result: result
    	});
    }).catch((err) => {
    	return res.status(400).json({
            error: {
                message: err.message
            }
        });
    });
});

router.get(['/', '/find'], (req, res) => {
    req.app.get('db').manyOrNone('SELECT * FROM results WHERE customer = ${customer};', {
        customer: req.user.id
    }).then((results) => {
        return res.json(results);
    }).catch((err) => {
        return res.status(400).json({
            error: {
                message: err.message
            }
        });
    });
});

module.exports = router;
