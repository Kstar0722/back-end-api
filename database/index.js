'use strict';

let knexfile = require('../knexfile')[process.env.NODE_ENV || 'development'],
  knex = require('knex')(knexfile),
  bookshelf = require('bookshelf')(knex);

bookshelf.plugin('registry');
bookshelf.plugin('pagination');

module.exports = bookshelf;
