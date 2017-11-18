'use strict';

let express = require('express'),
    router = express.Router();

// POST /, /create
router.post(['/', '/create'], (req, res) => {
	if(req.user.permission >= 2) {
		return res.status(401).json({
			error: {
				message: 'You are not permitted to add products'
			}
		});
	}
	req.app.get('db').one('INSERT INTO products (name, description) VALUES (${name}, ${description}) RETURNING *;', req.body).then((product) => {
		return res.status(201).json({
			product: product
		});
	}).catch((err) => {
		return res.status(500).json({
			error: {
                message: 'Server error occurred'
            }
		});
	});
});

// GET /, /find
router.get(['/', '/find'], (req, res) => {
	req.app.get('db').manyOrNone('SELECT * FROM products;').then((products) => {
		return res.json({
			products: products
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