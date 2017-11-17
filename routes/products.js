'use strict';

let express = require('express'),
    router = express.Router();

// POST /, /create
router.post(['/', '/create'], function(req, res) {
	if(req.user.permission >= 2) {
		req.app.get('db').one('INSERT INTO products (name, description) VALUES (${name}, ${description}) RETURNING *;', req.body).then((product) => {
			return res.status(201).json({
				product: product
			});
		}).catch((err) => {
			return res.status(500).json({});
		});
	} else {
		return res.status(401).json({});
	}
});

// GET /, /find
router.get(['/', '/find'], function(req, res) {
	req.app.get('db').manyOrNone('SELECT * FROM products;').then((products) => {
		return res.json({
			products: products
		});
	}).catch(() => {
		return res.status(500).json({});
	});
});

module.exports = router;