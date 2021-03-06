'use strict';

let express = require('express'),
  app = express(),
  path = require('path'),
  bodyParser = require('body-parser'),
  router = express.Router(),
  routes = require('./routes'),
  jwt = require('express-jwt'),
  cors = require('cors'),
  config = require('./config'),
  database = require('./database');

  global.ExternalServices = require('./lib/external_services');

app.set('database', database);
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(bodyParser.urlencoded({
  limit: '500mb',
  extended: true,
  type: 'application/x-www-form-urlencoded'
}));
app.use(bodyParser.json({
  limit: '500mb',
  type: 'application/*'
}));
app.use(require('express-pdf'));
app.use(require('skipper')());
app.use(jwt({
  secret: config.token_secret
}).unless({
  path: [{
    url: '/auth',
    methods: ['POST']
  }, {
    url: '/auth/forgot_password',
    methods: ['POST']
  }, {
    url: /auth\/reset_password\/.*$/,
    methods: ['POST']
  }, {
    url: '/orders/samcart',
    methods: ['POST']
  }]
}));
Object.keys(routes).forEach((route) => {
  router.use(`/${route}`, routes[route]);
});
app.use(router);
let listener = app.listen(process.env.PORT || 3000, () => {
  let address = listener.address();
  console.info(`Started server on ${address.address}${address.port} in ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
