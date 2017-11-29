'use strict';

let express = require('express'),
  router = express.Router(),
  Order = require('../models').order,
  Info = require('../models').info,
  Bluebird = require('bluebird'),
  _ = require('underscore'),
  JSONAPI = require('jsonapi-serializer');

// POST /, /create
router.post(['/', '/create'], (req, res) => {
  let Bookshelf = req.app.get('database');
  Bookshelf.transaction((t) => {
    return Order.forge({
      product: 'BluePrint',
      customer: req.user.id
    }).save(null, {
      transacting: t
    }).tap(function(order) {
      return Bluebird.map(_.map(req.body.info, (info) => {
        return info;
      }), function(info) {
        return Info.forge(info).save({
          order: order.id
        }, {
          transacting: t
        });
      });
    });
  }).then((order) => {
    return res.status(201).json(order);
  }).catch((err) => {
    return res.status(500).json({
      message: 'Server error occurred'
    });
  });
});

// GET /
router.get('/', (req, res) => {
  Info.forge().where(req.query).fetchAll().then(function(infos) {
    return res.json(new JSONAPI.Serializer('info', {
      id: 'id',
      attributes: Info.getAttributes()
    }).serialize(infos.toJSON()));
  }).catch(function() {
    return res.status(500).json({
      errors: [
        {
          status: 500,
          title: 'Server Error'
        }
      ]
    })
  });
});

module.exports = router;
