'use strict';

let express = require('express'),
  router = express.Router(),
  User = require('../models/User'),
  Order = require('../models/Order'),
  _ = require('underscore'),
  JSONAPI = require('jsonapi-serializer'),
  Serializer = JSONAPI.Serializer,
  Deserializer = JSONAPI.Deserializer,
  randstr = require('randomstring'),
  mailgun = require('mailgun-js')({
    apiKey: process.env.MAILGUN_KEY,
    domain: 'iifym.com'
  });

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
  new Order().where(_.extend(req.query, {
    customer: req.user.id
  })).fetchAll({
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

// GET /:id, /find/:id
router.get(['/:id', '/find/:id'], (req, res) => {
  new Order({
    id: req.params.id
  }).fetch({
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
router.patch(['/:id', '/edit/:id'], (req, res) => {
  new Deserializer().deserialize(req.body, (err, edits) => {
    if(err) {
      return res.status(500).json({
        message: 'Server error occurred'
      });
    }
    let attributes = _.omit(edits, 'created-at', 'updated-at');
    new Order(attributes).save().then((order) => {
      return res.json(new Serializer('order', {
        id: 'id',
        attributes: Object.keys(order.toJSON())
      }).serialize(order.toJSON()));
    }, (err) => {
      return res.status(500).json({
        message: 'Server error occurred'
      });
    });
  });
});

module.exports = router;
