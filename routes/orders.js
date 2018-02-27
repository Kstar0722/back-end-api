'use strict';

let express = require('express'),
  router = express.Router(),
  User = require('../models').user,
  Order = require('../models').order,
  Role = require('../models').role,
  Info = require('../models').info,
  Upload = require('../models').upload,
  BlueprintDetails = require('../models').blueprint_details,
  _ = require('lodash'),
  JSONAPI = require('jsonapi-serializer'),
  Serializer = JSONAPI.Serializer,
  Deserializer = JSONAPI.Deserializer,
  randstr = require('randomstring'),
  helper = require('../lib/helper'),
  mailgun = require('mailgun-js')({
    apiKey: process.env.MAILGUN_KEY,
    domain: 'iifym.com'
  }),
  bcrypt = require('bcrypt'),
  fs = require('fs'),
  path = require('path'),
  dust = require('dustjs-linkedin'),
  CheckIt = require('checkit');

// POST /, /create
router.post(['/', '/create'], (req, res) => {

  if (req.user.role != 2){
    return res.status(403).json({
      message: 'Forbidden'
    });
  }

  let order;

  new Deserializer({keyForAttribute: 'snake_case'}).deserialize(req.body).then((_order) => {
    order = _order;

    order = _.pick(order, _.difference(Order.getAttributes(), ['created_at', 'updated_at', 'user']));

    return new CheckIt({
      product: 'required',
      price: 'required',
      status: 'required',
      customer: 'required',
    }).run(order);
  }).then(() => {
    return Order.forge(order).save();
  }).then((order) => {
    res.json(new Serializer('order', {
      id: 'id',
      attributes: Order.getAttributes(),
    }).serialize(order.toJSON()));
  }).catch((err) => {
    res.status(500).json({
      message: 'Server error occurred'
    });
  });
});

// GET /, /find
router.get(['/', '/find'], (req, res) => {

  if (req.user.role == 1){
    if (!req.query.filter){
      req.query.filter = {};
    }
    req.query.filter.customer = req.user.id;
  }

  let normalizedQuery = helper.normalizeQuery(req.query, Order.getAttributes());
  helper.fetchPaginationData(normalizedQuery, Order, ['user']).then((orders) => {
    return res.json(new Serializer('order', {
      id: 'id',
      attributes: Order.getAttributes(),
      user: {
        ref: 'id',
        attributes: User.getAttributes()
      },
      topLevelLinks: helper.genNavLinks(helper.getHomeUrl(req)+"/orders", normalizedQuery, orders.pagination.rowCount),
      meta: {
        count: orders.pagination.rowCount,
        pageCount: orders.pagination.pageCount,
        pageSize: orders.pagination.pageSize,
        page: orders.pagination.page
      }
    }).serialize(orders.toJSON()));
  }, (err) => {
    return res.status(500).json({
      message: 'Server error occurred'
    });
  });
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
router.get(['/:id([0-9]+)', '/find/:id([0-9]+)'], (req, res) => {
  Order.forge({
    id: req.params.id
  }).fetch({
    withRelated: ['user', 'infos', 'details', 'uploads']
  }).then((order) => {
    return res.json(new Serializer('order', {
      id: 'id',
      attributes: _.union(Order.getAttributes(), ['infos', 'details', 'uploads']),
      user: {
        ref: 'id',
        attributes: User.getAttributes()
      },
      infos: {
        ref: 'id',
        attributes: Info.getAttributes()
      },
      details: {
        ref: 'id',
        attributes: BlueprintDetails.getAttributes()
      },
      uploads: {
        ref: 'id',
        attributes: Upload.getAttributes()
      }
    }).serialize(order.toJSON()));
  }, () => {
    return res.status(500).json({
      message: 'Server error occurred'
    });
  });
});

// PATCH /:id, /orders/:id
router.patch(['/:id([0-9]+)', '/edit/:id([0-9]+)'], (req, res) => {

  if (req.user.role != 2){
    return res.status(403).json({
      message: 'Forbidden'
    });
  }

  let order = {};

  new Deserializer({keyForAttribute: 'snake_case'}).deserialize(req.body).then((_order) => {
    order = _order;

    order = _.pick(order, _.union(_.difference(Order.getAttributes(), ['created_at', 'updated_at', 'user']), ['id']));

    return Order.forge(order).save();
  }).then((order) => {
    return res.json(new Serializer('order', {
      id: 'id',
      attributes: Object.keys(order.toJSON())
    }).serialize(order.toJSON()));
  }).catch((err) => {
    return res.status(500).json({
      message: 'Server error occurred'
    });
  });
});

// PATCH /orders/:id/details
router.patch('/:id([0-9]+)/details', (req, res) => {
  new Deserializer({
    keyForAttribute: 'snake_case'
  }).deserialize(req.body, (err, edits) => {
    if(err) {
      return res.status(500).json({
        message: 'Server error occurred'
      });
    }
    BlueprintDetails.where({'order': req.params.id}).save(edits, {patch: true}).then((details) => {
      return res.json(new Serializer('blueprint_details', {
        id: 'id',
        attributes: Object.keys(details.toJSON()),
        keyForAttribute: 'snake_case'
      }).serialize(details.toJSON()));
    }, (err) => {
      return res.status(500).json({
        message: 'Server error occurred'
      });
    });
  });
});

// GET /:id/details
router.get('/:id([0-9]+)/details', (req, res) => {
  BlueprintDetails.forge({
    order: req.params.id
  }).fetch({
  }).then((details) => {
    return res.json(new Serializer('details', {
      id: 'id',
      attributes: BlueprintDetails.getAttributes(),
      keyForAttribute: 'snake_case'
    }).serialize(details.toJSON()));
  }, () => {
    return res.status(500).json({
      message: 'Server error occurred'
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

router.get('/info', (req, res) => {
  var result = {
    has_blueprint: false,
    need_to_fill_form: false,
    has_90daychalenge: false
  };
  Order.where({product: "90 Day Challenge"}).orderBy('updated_at', 'DESC').fetch().then((order) => {
      if (order){
        result.has_90daychalenge = true;
      }
      return Order.where({product: 'BluePrint'}).orderBy('updated_at', 'DESC').fetch();
    }).then((order) => {
      if (order){
        result.has_blueprint = true;
        result.need_to_fill_form = true;
        return Info.where({
            order: order.id
          }).count('*').then((count) => {
            if (count > 0) {
              result.need_to_fill_form = false;
            }
            return Promise.resolve(null);
          });
      } else {
        return Promise.resolve(null);
      }
    }).then(() => {
      return res.json(result);
    }, () => {
      return res.status(500).json({
        message: 'Server error occurred'
      });
    });

});

module.exports = router;
