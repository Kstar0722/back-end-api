'use strict';

let express = require('express'),
    router = express.Router();

// GET /, /find
router.get(['/', '/find'], (req, res) => {
	req.app.get('db').manyOrNone(req.app.get('queries').products.find).then((products) => {
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
