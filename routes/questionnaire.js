'use strict';

let express = require('express'),
  router = express.Router(),
  Info = require('../models').info,
  Bluebird = require('bluebird');

router.post(['/', '/create'], (req, res) => {
  let Bookshelf = req.app.get('database');
  Bookshelf.transaction((t) => {
    return Bluebird.map(req.body, (info) => {
      return new Info(info).save({
        user: req.user.id
      }, {
        transacting: t
      });
    });
  }).then((infos) => {
    return res.status(201).json(infos);
  }).catch((err) => {
    return res.status(500).json({
      message: 'Server error occurred'
    });
  });
});

module.exports = router;
