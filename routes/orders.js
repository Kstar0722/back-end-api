'use strict';

let express = require('express'),
  router = express.Router(),
  User = require('../models').user,
  Order = require('../models').order,
  Role = require('../models').role,
  _ = require('underscore'),
  JSONAPI = require('jsonapi-serializer'),
  Serializer = JSONAPI.Serializer,
  Deserializer = JSONAPI.Deserializer,
  randstr = require('randomstring'),
  mailgun = require('mailgun-js')({
    apiKey: process.env.MAILGUN_KEY,
    domain: 'iifym.com'
  }),
  bcrypt = require('bcrypt'),
  fs = require('fs'),
  path = require('path');

// POST /, /create
router.post(['/', '/create'], (req, res) => {
  Order.forge(_.extend(req.body, {
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
  User.forge({
    id: req.user.id
  }).fetch({
    withRelated: 'role'
  }).then((user) => {
    if(user.toJSON().role.role === 'customer') {
      req.query.customer = user.id;
    }
    Order.forge().where(req.query).fetchAll({
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
  })
});

// GET /count
router.get('/count', (req, res) => {
  Order.forge().where(req.query).count().then((count) => {
    return res.json({
      count: count
    });
  }, () => {
    return res.status(500).json({
      message: 'Server error occurred'
    });
  });
});

// GET /:id, /find/:id
router.get(['/:id', '/find/:id'], (req, res) => {
  Order.forge({
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
    Order.forge(attributes).save().then((order) => {
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

router.post('/samcart', (req, res) => {
  User.where('email', req.body.customer.email).count().then((count) => {
    if(count > 0) {
      User.forge({
        email: req.body.customer.email
      }).fetch().then((user) => {
        Order.forge({
          customer: user.id,
          product: req.body.product.name,
          price: req.body.order.total,
          status: 'Received'
        }).save().then((order) => {
          return res.json(201, order.toJSON());
        });
      });
    } else {
      let password = randstr.generate(12);
      bcrypt.hash(password, 12, (err, hash) => {
        if(err) {
          return res.status(500).send();
        }
        User.forge({
          first_name: req.body.customer.first_name,
          last_name: req.body.customer.last_name,
          email: req.body.customer.email,
          password: hash
        }).save().then((user) => {
          fs.readFile(path.join(__dirname, '..', 'templates', 'samcart.html'), (err, data) => {
            mailgun.messages().send({
              from: 'IIFYM <accounts@iifym.com>',
              to: req.body.customer.email,
              subject: 'Your IIFYM Account',
              html: require('util').format(data.toString(), req.body.customer.email, password)
            }, (err, body) => {
              if (err) {
                return res.status(500).json({
                  error: {
                    message: 'Server error occurred'
                  }
                });
              }
            });
          });
          Order.forge({
            customer: user.id,
            product: req.body.product.name,
            price: req.body.order.total,
            status: 'Received'
          }).save().then((order) => {
            return res.json(201, order.toJSON());
          });
        });
      });
    }
  });
});

module.exports = router;
