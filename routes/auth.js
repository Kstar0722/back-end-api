'use strict';

let express = require('express'),
  router = express.Router(),
  bcrypt = require('bcrypt'),
  randstr = require('randomstring'),
  jwt = require('jsonwebtoken'),
  _ = require('underscore'),
  config = require('../config'),
  helper = require('../lib/helper'),
  CheckIt = require('checkit'),
  JSONAPI = require('jsonapi-serializer'),
  Serializer = JSONAPI.Serializer,
  User = require('../models').user;

// POST /
router.post('/', (req, res) => {
  new CheckIt({
    username: ['required', 'email'],
    password: 'required'
  }).run(req.body).then(() => {
    User.where({
      email: req.body.email || req.body.username
    }).fetch({
      withRelated: ['role']
    }).then((user) => {
      /*if(user.relations.role.attributes.role !== 'admin') {
        return res.status(403).json({
          message: 'Only admins may login'
        });
      }*/
      if(user === null) {
        return res.status(401).json({
          message: 'Incorrect credentials'
        });
      }
      user = user.toJSON();
      bcrypt.compare(req.body.password, user.password, (err, matches) => {
        if(err) {
          return res.status(500).json({
            message: 'Server error occurred'
          });
        }
        if(matches) {
          return res.json({
            access_token: jwt.sign({
              id: user.id,
              role: user.role.id
            }, config.token_secret),
            user: {
              id: user.id,
              role: user.role.id
            }
          });
        } else {
          return res.status(401).json({
            message: 'Incorrect credentials'
          });
        }
      });
    }).catch(() => {
      return res.status(500).json({
        message: 'Server error occurred'
      });
    });
  }).catch((err) => {
    return res.status(400).json({
      message: 'Email and password must be present'
    });
  });
});

// POST /reset_password/:token
router.post('/reset_password/:token', (req, res) => {
  let user;
  new CheckIt({
    password: 'required'
  }).run(req.body).then(() => {
    return User.where({
      reset_password_token: req.params.token
    }).fetch();
  }).then((_user) => {
    user = _user;
    if (!user) {
      return res.status(400).json({
        message: 'token not found'
      });
    }
    return helper.hashPassword(req.body.password);
  }).then((hash) => {
    user.attributes.password = hash;
    user.attributes.reset_password_token = null;
    return user.save();
  }).then(user => {
    return res.json({});
  }).catch((err) => {
    return res.status(400).json({
      message: err.message
    });
  });
});

// POST /forgot_password
router.post('/forgot_password', (req, res) => {
  new CheckIt({
    email: ['required', 'email']
  }).run(req.body).then(() => {
    return User.where({
      email: req.body.email
    }).fetch();
  }).then((user) => {
    if (!user) {
      return res.status(404).json({
        message: 'email not found'
      });
    }
    let token = randstr.generate({length: 30, capitalization: "lowercase"});
    user.set('reset_password_token', token);
    return user.save();
  }).then((user) => {
    let url = `http://${config.domain}/${config.reset_password_url}?token=${user.get('reset_password_token')}`;
    return helper.sendEmail(user.attributes.email, "reset_password", {url});
  }).then((sentEmailInfo) => {
    return res.json({});
  }).catch((err) => {
    return res.status(400).json({
      message: err.message
    });
  });
});


module.exports = router;
