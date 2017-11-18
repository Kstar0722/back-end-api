'use strict';

let express = require('express'),
    router = express.Router(),
    _ = require('underscore');

// POST /, /create
router.post(['/', '/create'], (req, res) => {
	req.app.get('db').one('INSERT INTO orders (customer, product, quantity) VALUES (${customer}, ${product}, ${quantity}) RETURNING *;', _.extend(req.body, {
    	customer: req.user.id
    })).then((order) => {
    	return res.status(201).json({
    		order: order
    	});
    }).catch((err) => {
    	return res.status(400).json({
            error: {
                message: err.message
            }
        });
    });
});

// GET /, /find
router.get(['/', '/find'], (req, res) => {
	req.app.get('db').manyOrNone('SELECT orders.id, products.name, orders.quantity, users.email, users.first_name, users.last_name, orders.created_at FROM orders INNER JOIN users ON orders.customer = users.id INNER JOIN products ON orders.product = products.id WHERE orders.customer = ${customer};', {
		customer: req.user.id
	}).then((orders) => {
		return res.json({
			orders: orders
		});
	}).catch(() => {
		return res.status(500).json({
            error: {
                message: 'Server error occurred'
            }
        });
	});
});

// GET /:id, /find/:id
router.get(['/:id', '/find/:id'], (req, res) => {
    req.app.get('db').oneOrNone('SELECT orders.id, products.name, orders.quantity, users.email, users.first_name, users.last_name, orders.created_at FROM orders INNER JOIN users ON orders.customer = users.id INNER JOIN products ON orders.product = products.id WHERE orders.customer = ${customer} AND orders.id = ${order};', {
        customer: req.user.id,
        order: req.params.id
    }).then((order) => {
        return res.json({
            order: order
        });
    }).catch(() => {
        return res.status(500).json({
            error: {
                message: 'Server error occurred'
            }
        });
    });
});

module.exports = router;