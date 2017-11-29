'use strict';

let express = require('express'),
  router = express.Router(),
  Order = require('../models').order,
  Info = require('../models').info,
  BlueprintDetails = require('../models').blueprint_details,
  Bluebird = require('bluebird'),
  _ = require('underscore'),
  BluePrint = require('../blueprint'),
  JSONAPI = require('jsonapi-serializer');

// POST /, /create
router.post(['/', '/create'], (req, res) => {
  let Bookshelf = req.app.get('database');
  Order.where({
    product: 'BluePrint',
    customer: req.user.id
  }).fetch().then(function(order) {
    let details = BluePrint.calculate( BluePrint.formatInfos(req.body.info) );
    return Bookshelf.transaction((t) => {
      return Bluebird.all([
        BlueprintDetails.forge(details).save({
          order: order.id
        }, {
          transacting: t
        }).then(() => {
          return Promise.resolve(order);
        }),
        Bluebird.map(_.map(req.body.info, (info) => {
          return info;
        }), function(info) {
          return Info.forge(info).save({
            order: order.id
          }, {
            transacting: t
          });
        })
      ]).then(function() {
        return Promise.resolve(order);
      });
    });
  }).then((order) => {
    return res.status(200).json(order);
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
