'use strict';

let express = require('express'),
    router = express.Router(),
    _ = require('underscore'),
    util = require('util');

router.post(['/', '/create'], (req, res) => {
	let query = util.format('INSERT INTO infos (customer, key, value) VALUES %s RETURNING *;', _.map(req.body.info, (obj) => {
	    return req.app.get('pgp').as.format('(${customer}, ${key}, ${value})', _.extend(obj, {
	    	customer: req.user.id
	    }));
	}).join(','));
	req.app.get('db').manyOrNone(query).then((infos) => {
		return res.status(201).json({
			infos: infos
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
	let parameters = _.map(req.query, (val, key) => {
		return req.app.get('pgp').as.format('(key = ${key} AND value = ${value})', {
			key: key,
			value: val
		});
	}).join(' AND ');
	req.app.get('db').manyOrNone(util.format('SELECT * FROM infos WHERE customer = ${customer}%s%s;', _.isEmpty(parameters) ? '' : ' AND ', parameters), {
		customer: req.user.id
	}).then((infos) => {
		return res.json({
			infos: infos
		});
	}).catch((err) => {
    	return res.status(400).json({
            error: {
                message: err.message
            }
        });
    });
});

module.exports = router;