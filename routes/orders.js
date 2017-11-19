'use strict';

let express = require('express'),
    router = express.Router(),
    path = require('path'),
    fs = require('fs'),
    _ = require('underscore'),
    bcrypt = require('bcrypt'),
    randstr = require('randomstring'),
    mailgun = require('mailgun-js')({
        apiKey: 'key-c418a3366123098e2e5cb660f6cbf229',
        domain: 'iifym.com'
    });

// POST /, /create
router.post(['/', '/create'], (req, res) => {
	req.app.get('db').one(req.app.get('queries').orders.create, _.extend(req.body, {
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
	req.app.get('db').manyOrNone('SELECT orders.id, orders.product, orders.price, users.email, users.first_name, users.last_name, orders.created_at FROM orders INNER JOIN users ON orders.customer = users.id WHERE orders.customer = ${customer};', {
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
    req.app.get('db').oneOrNone('SELECT orders.id, orders.product, orders.price, users.email, users.first_name, users.last_name, orders.created_at FROM orders INNER JOIN users ON orders.customer = users.id WHERE orders.customer = ${customer} AND orders.id = ${order} LIMIT 1;', {
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

router.post('/samcart', (req, res) => {
    if(req.body.type !== 'Order') {
        return res.status(400).json({});
    }
    req.app.get('db').one(req.app.get('queries').users.count, {
        email: req.body.customer.email
    }).then((result) => {
        let password = randstr.generate(24);
        if(result.count < 1) {
            fs.readFile(path.join(__dirname, '..', 'templates', 'samcart.html'), (err, data) => {
                mailgun.messages().send({
                    from: 'IIFYM <accounts@iifym.com>',
                    to: req.body.customer.email,
                    subject: 'Your IIFYM Account',
                    html: require('util').format(data.toString(), req.body.customer.email, password)
                }, (err, body) => {
                    if(err) {
                        return res.status(500).json({
                            error: {
                                message: 'Server error occurred'
                            }
                        });
                    }
                });
            });
        }
        bcrypt.hash(password, 12, (err, hash) => {
            if(err) {
                return res.status(500).json({
                    error: {
                        message: 'Server error occurred'
                    }
                });
            }
            req.app.get('db').one(req.app.get('queries').users.findOrCreate, _.extend(req.body.customer, {
                password: hash,
                permission: 0
            })).then((user) => {
                req.app.get('db').one(req.app.get('queries').orders.create, {
                    customer: user.id,
                    product: req.body.product.name,
                    price: req.body.order.total
                }).then((order) => {
                    return res.status(201).json(order);
                }).catch(() => {
                    return res.status(500).json({
                        error: {
                            message: 'Server error occurred'
                        }
                    });
                });
            }).catch(() => {
                return res.status(500).json({
                    error: {
                        message: 'Server error occurred'
                    }
                });
            });
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