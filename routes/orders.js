'use strict';

let express = require('express'),
    router = express.Router(),
    _ = require('underscore');

// POST /, /create
router.post(['/', '/create'], function(req, res) {
	req.app.get('db').one('INSERT INTO orders (customer, product, quantity) VALUES (${customer}, ${product}, ${quantity}) RETURNING *;', _.extend(req.body, {
    	customer: req.user.id
    })).then((product) => {
    	return res.status(201).json({
    		product: product
    	});
    }).catch((err) => {
    	return res.status(500).json({});
    });
});

// GET /, /find
router.get(['/', '/find'], function(req, res) {
	req.app.get('db').manyOrNone('SELECT orders.id, products.name, orders.quantity, users.email, users.first_name, users.last_name, orders.created_at FROM orders INNER JOIN users ON orders.customer = users.id INNER JOIN products ON orders.product = products.id WHERE orders.customer = ${customer};', {
		customer: req.user.id
	}).then((products) => {
		return res.json({
			products: products
		});
	}).catch(() => {
		return res.status(500).json({});
	});
});

module.exports = router;