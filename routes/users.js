'use strict';

let express = require('express'),
  router = express.Router(),
  bcrypt = require('bcrypt'),
  _ = require('underscore'),
  User = require('../models').user,
  Role = require('../models').role,
  Order = require('../models').order,
  CheckIt = require('checkit'),
  JSONAPI = require('jsonapi-serializer'),
  Serializer = JSONAPI.Serializer;

// POST /, /create
router.post(['/', '/create'], (req, res) => {
  new CheckIt({
    first_name: 'required',
    last_name: 'required',
    email: ['required', 'email'],
    password: 'required'
  }).run(req.body).then(() => {
    bcrypt.hash(req.body.password, 12, (err, hash) => {
      if(err) {
        return res.status(500).json({
          message: 'Server error occurred'
        });
      }
      req.body.password = hash;
      User.forge(req.body).save().then((user) => {
        return res.json(new Serializer('user', {
          id: 'id',
          attributes: User.getAttributes(),
        }).serialize(user.toJSON()));
      }, () => {
        return res.status(500).json({
          message: 'Server error occurred'
        });
      });
    });
  }).catch((err) => {
    return res.status(400).json(err);
  });
});

// GET /:id, /find/:id
router.get(['/:id', '/find/:id'], (req, res) => {
  User.forge({
    id: req.params.id
  }).fetch({
    withRelated: ['role', 'orders']
  }).then((user) => {
    console.log(user.toJSON());
    return res.json(new Serializer('user', {
      id: 'id',
      attributes: _.omit(Object.keys(user.toJSON()), 'id'),
      role: {
        ref: 'id',
        attributes: Role.getAttributes()
      },
      orders: {
        ref: 'id',
        attributes: Order.getAttributes()
      }
    }).serialize(user.toJSON()));
  }, (err) => {
    console.error(err);
    return res.status(500).json({
      message: 'Server error occurred'
    });
  });
});

module.exports = router;
