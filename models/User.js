'use strict';

let bookshelf = require('../database'),
  User = bookshelf.Model.extend({
    tableName: 'users',
    hasTimestamps: true,
    orders: function() {
      return this.hasMany('Order', 'customer');
    }
  }, {
    getAttributes: () => {
      return ['first_name', 'last_name', 'email', 'password', 'created_at', 'updated_at'];
    }
  });

module.exports = bookshelf.model('User', User);
