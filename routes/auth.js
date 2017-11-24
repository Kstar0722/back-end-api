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
    console.info(`Attempting to authenticate ${req.body.email}`);
    User.where({
      email: req.body.email || req.body.username
    }).fetch().then((user) => {
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
              id: user.id
            }, config.token_secret),
            user: {
              id: user.id
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
