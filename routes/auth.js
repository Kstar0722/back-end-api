'use strict';

let express = require('express'),
  router = express.Router(),
  bcrypt = require('bcrypt'),
  jwt = require('jsonwebtoken'),
  _ = require('underscore'),
  config = require('../config'),
  User = require('../models').user;

// POST /
router.post('/', (req, res) => {
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
});

module.exports = router;
