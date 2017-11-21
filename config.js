'use strict';

let config = {
  development: {
    token_secret: 'secret'
  },
  production: {
    token_secret: process.env.TOKEN_SECRET
  }
}

module.exports = config[process.env.NODE_ENV || 'development'];
