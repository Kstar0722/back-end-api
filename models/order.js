'use strict';

let bookshelf = require('../database'),
  Order = bookshelf.Model.extend({
    tableName: 'orders',
    hasTimestamps: true,
    user: function() {
      return this.belongsTo('User', 'customer');
    }
  }, {
    getAttributes: () => {
      return ['product', 'price', 'status', 'user', 'created_at', 'updated_at'];
    }
  });

module.exports = bookshelf.model('Order', Order);
