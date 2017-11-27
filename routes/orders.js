'use strict';

let express = require('express'),
  router = express.Router(),
  User = require('../models').user,
  Order = require('../models').order,
  Role = require('../models').role,
  Info = require('../models').info,
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
  path = require('path'),
  dust = require('dustjs-linkedin'),
  CheckIt = require('checkit');

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
router.get(['/:id([0-9]+)', '/find/:id([0-9]+)'], (req, res) => {
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
router.patch(['/:id([0-9]+)', '/edit/:id([0-9]+)'], (req, res) => {
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

// POST /pdf
router.post('/pdf', (req, res) => {
  Info.forge({
    user: req.user.id
  }).fetchAll().then((infos) => {
    _.each(infos.toJSON(), (info) => {
      req.body[info.key] = info.value;
    });
    new CheckIt({
      name: 'required',
      current_weight: 'required',
      target_weight: 'required',
      gender: 'required',
      activity_level: 'required'
    }).run(req.body).then(() => {
      let dir = path.join(__dirname, '..', 'templates', 'blueprint.html');
      fs.readFile(dir, (err, template) => {
        if(err) {
          return res.status(500).json({
            error: {
              message: 'Server error occurred'
            }
          });
        }
        let variables = {
          name: req.body.name,
          current_weight: req.body.current_weight,
          target_weight: req.body.target_weight,
          gender: req.body.gender,
          activity_level: req.body.activity_level
        };
        variables.default_protein = {
          none: variables.target_weight * 0.8,
          moderate: variables.target_weight * 0.9,
          high: variables.target_weight * 1
        };
        variables.default_protein = variables.default_protein[variables.activity_level];
        variables.default_carbs = {
          male: {
            none: variables.current_weight * 1.2,
            moderate: variables.current_weight * 1.4,
            high: variables.current_weight * 1.6
          },
          female: {
            none: variables.current_weight * 1,
            moderate: variables.current_weight * 1.2,
            high: variables.current_weight * 1.4
          }
        };
        variables.default_carbs = variables.default_carbs[variables.gender][variables.activity_level];
        if(variables.gender == 'male') {
          variables.default_fat = variables.current_weight > 350 ? variables.current_weight * .3 : variables.current_weight * .28;
        } else {
          if(variables.current_weight > 200) {
            variables.default_fat = variables.current_weight * .4;
          } else if(variables.current_weight <= 201 && variables.current_weight >= 250) {
            variables.default_fat = variables.current_weight * .375;
          } else if(variables.current_weight < 250 && variables.current_weight >= 300) {
            variables.default_fat = variables.current_weight * .35;
          } else {
            variables.default_fat = variables.current_weight * .325;
          }
        }
        variables.default_calories = {
          protein: variables.default_protein * 4,
          carbs: variables.default_carbs * 4,
          fat: variables.default_fat * 9
        };
        variables.default_coefficient = variables.current_weight * 11;
        variables.refeed_macros_fat = variables.default_fat * 0.8;
        variables.refeed_macros_carbs = variables.default_carbs * 1.6;
        variables.refeed_macros_protein = variables.default_protein * 0.8;
        dust.renderSource(template.toString(), variables, (err, rendered) => {
          if(err) {
            return res.status(500).json({
              error: {
                message: 'Server error occurred'
              }
            });
          }
          return res.pdfFromHTML({
            filename: 'blueprint.pdf',
            htmlContent: rendered
          });
        });
      });
    }).catch(() => {
      return res.status(401).json({
        error: {
          message: 'Missing required attributes'
        }
      });
    });
  }, (err) => {
    return res.status(500).json({
      error: {
        message: 'Server error occurred'
      }
    });
  });
});

module.exports = router;
