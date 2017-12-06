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
    return res.status(500).json(err)
  });

});

// PATCH /:id, /edit/:id
  router.patch(['/:id([0-9]+)', '/edit/:id([0-9]+)'], (req, res) => {

  if (req.user.role != 2 && req.user.id != req.params.id){
    return res.status(403).json({
      message: 'Forbidden'
    });
  }

  let user;
  new Deserializer({keyForAttribute: 'snake_case'}).deserialize(req.body).then((_user) => {
    user = _user;

    user = _.pick(user, _.union(_.difference(User.getAttributes(), ['created_at', 'updated_at']), ['password']));

    if (!_.isUndefined(user.password) && !user.password) {
      delete user.password;
    }

    return new CheckIt({
      first_name: 'string',
      last_name: 'string',
      email: 'email',
      password: 'string'
    }).run(user);

  }).then(() => {
    if (user.password) {
      return helper.hashPassword(user.password);
    }
    return Promise.resolve(null);
  }).then((hash) => {
    if (hash){
      user.password = hash;
    }
    return User.forge().where({id: req.params.id}).save(user, {patch: true});
  }).then((user) => {
    return res.json(new Serializer('user', {
      id: 'id',
      attributes: User.getAttributes(),
    }).serialize(user.toJSON()));
  }).catch((err) => {
    return res.status(500).json(err)
  });

});

// GET /:id, /find/:id
router.get(['/:id', '/find/:id'], (req, res) => {

  if (req.user.role != 2 && req.user.id != req.params.id){
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
      attributes: User.getAttributes(),
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

// GET /
router.get('/', (req, res) => {

  if (req.user.role != 2){
    return res.status(403).json({
      message: 'Forbidden'
    });
  }

  let params = _.omit(req.query || {}, ['page']);

  User.forge().orderBy('created_at', 'DESC').where(params).fetchPage({
    page: req.query.page || 1,
    pageSize: 20,
    withRelated: ['role']
  }).then((users) => {
    return res.json(new Serializer('user', {
      id: 'id',
      attributes: User.getAttributes(),
      role: {
        ref: 'id',
        attributes: Role.getAttributes()
      },
    }).serialize(users.toJSON()));
  }, () => {
    return res.status(500).json({
      message: 'Server error occurred'
    });
  });
});

module.exports = router;
