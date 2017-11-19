'use strict';

let express = require('express'),
  router = express.Router(),
  User = require('../models/User'),
  Order = require('../models/Order'),
  _ = require('underscore'),
  JSONAPI = require('jsonapi-serializer'),
  Serializer = JSONAPI.Serializer,
  Deserializer = JSONAPI.Deserializer;

// POST /, /create
router.post(['/', '/create'], (req, res) => {
  new Order(_.extend(req.body, {
    customer: req.user.id
  })).save().then((order) => {
    return res.json(new Serializer('order', {
      id: 'id',
      attributes: _.omit(Order.getAttributes(), 'user'),
    }).serialize(order.toJSON()));
  }, () => {
    return res.status(500).json({
      message: 'Server error occurred'
    });
  })
});

// GET /, /find
router.get(['/', '/find'], (req, res) => {
  new Order({
    customer: req.user.id
  }).fetchAll({
    withRelated: ['user']
  }).then((orders) => {
    return res.json(new Serializer('order', {
      id: 'id',
      attributes: Order.getAttributes(),
      user: {
        ref: 'id',
        attributes: User.getAttributes()
      }
    }).serialize(orders.toJSON()));
  }, () => {
    return res.status(500).json({
      message: 'Server error occurred'
    });
  });
});

// PATCH /:id, /orders/:id
router.patch(['/:id', '/orders/:id'], (req, res) => {
  console.log(req.body)
  Deserializer.deserialize(req.body, (err, order) => {
    if(err) {
      console.error(err);
      return res.status(500).json({
        message: 'Server error occurred'
      });
    }
    console.log(order);
    return res.json({});
  });
  /*new Order(_.extend(req.body, {
    id: req.params.id
  })).save().then((order) => {
    return res.json(new Serializer('order', {
      id: 'id',
      attributes: _.omit(Order.getAttributes(), 'user'),
      user: {
        ref: 'id',
        attributes: User.getAttributes()
      }
    }).serialize(order.toJSON()));
  }, (err) => {
    return res.status(500).json({
      message: 'Server error occurred'
    });
  });*/
});

module.exports = router;
