'use strict';

let express = require('express'),
  router = express.Router(),
  bcrypt = require('bcrypt'),
  jwt = require('jsonwebtoken'),
  _ = require('underscore'),
  config = require('../config'),
  CheckIt = require('checkit'),
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

module.exports = router;
