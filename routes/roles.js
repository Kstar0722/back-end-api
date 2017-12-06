'use strict';

let express = require('express'),
  router = express.Router(),
  Role = require('../models').role,
  JSONAPI = require('jsonapi-serializer'),
  Serializer = JSONAPI.Serializer;

// GET /:id, /find/:id
router.get(['/:id', '/find/:id'], (req, res) => {

  if (req.user.role != 2){
    return res.status(403).json({
      message: 'Forbidden'
    });
  }

  Role.forge({
    id: req.params.id
  }).fetch({
    withRelated: []
  }).then((role) => {
    if(!role) {
      return res.status(404).json({});
    }
    return res.json(new Serializer('role', {
      id: 'id',
      attributes: Role.getAttributes(),
    }).serialize(role.toJSON()));
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

  Role.forge().fetchAll().then((roles) => {
    return res.json(new Serializer('role', {
      id: 'id',
      attributes: Role.getAttributes(),
    }).serialize(roles.toJSON()));
  }, () => {
    return res.status(500).json({
      message: 'Server error occurred'
    });
  });
});

module.exports = router;
