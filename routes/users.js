'use strict';

let express = require('express'),
  router = express.Router(),
  _ = require('underscore'),
  helper = require('../lib/helper'),
  User = require('../models').user,
  Role = require('../models').role,
  Order = require('../models').order,
  CheckIt = require('checkit'),
  JSONAPI = require('jsonapi-serializer'),
  Deserializer = JSONAPI.Deserializer,
  Serializer = JSONAPI.Serializer;

// POST /, /create
router.post(['/', '/create'], (req, res) => {

  if (req.user.role != 2){
    return res.status(403).json({
      message: 'Forbidden'
    });
  }

  let user;
  new Deserializer({keyForAttribute: 'snake_case'}).deserialize(req.body).then((_user) => {
    user = _user;

    user = _.pick(user, _.union(_.difference(User.getAttributes(), ['created_at', 'updated_at']), ['password']));

    return new CheckIt({
      first_name: 'required',
      last_name: 'required',
      email: ['required', 'email'],
      password: 'required'
    }).run(user);

  }).then(() => {
    return helper.hashPassword(user.password);
  }).then((hash) => {
    user.password = hash;
    return User.forge(user).save();
  }).then((user) => {
    return res.json(new Serializer('user', {
      id: 'id',
      attributes: User.getAttributes(),
    }).serialize(user.toJSON()));
  }).catch((err) => {
    return res.status(500).json({
      message: err.message
    });
  });

});

// GET /:id, /find/:id
router.get(['/:id', '/find/:id'], (req, res) => {

  if (req.user.role != 2 || req.user.id != req.params.id){
    return res.status(403).json({
      message: 'Forbidden'
    });
  }

  User.forge({
    id: req.params.id
  }).fetch({
    withRelated: ['role', 'orders']
  }).then((user) => {
    if(!user) {
      return res.status(404).json({});
    }
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
  }, () => {
    return res.status(500).json({
      message: 'Server error occurred'
    });
  });
});

module.exports = router;
