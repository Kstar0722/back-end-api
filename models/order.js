'use strict';

let bookshelf = require('../database'),
  Order = bookshelf.Model.extend({
    tableName: 'orders',
    hasTimestamps: true,
    user: function() {
      return this.belongsTo('User', 'customer');
    },
    infos: function() {
      return this.hasMany('Info', 'order');
    },
    details: function() {
      return this.hasOne('BlueprintDetails', 'order');
    },
    uploads: function() {
      return this.hasMany('Upload', 'order');
    }
  }, {
    getAttributes: () => {
      return ['product', 'price', 'status', 'customer', 'user', 'created_at', 'updated_at'];
    }
  });

module.exports = bookshelf.model('Order', Order);
