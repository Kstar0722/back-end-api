'use strict';

let express = require('express'),
  router = express.Router(),
  _ = require('underscore'),
  fs = require('fs'),
  path = require('path'),
  dust = require('dustjs-linkedin'),
  CheckIt = require('checkit'),
  BluePrint = require('../blueprint');

  router.post(['/:id', '/find/:id'], (req, res) => {
    BluePrint.create(req.params.id, (err, blueprint) => {
      if(err) {
        console.error(err);
        return res.status(500).json({
          errors: [
            {
              status: 500,
              title: 'Server Error',
              message: 'There was some trouble creating the BluePrint'
            }
          ]
        });
      }
      console.log(BluePrint.formatInfos(blueprint));
      return res.json(blueprint);
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
