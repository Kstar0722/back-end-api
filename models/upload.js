'use strict';

let bookshelf = require('../database'),
  Upload = bookshelf.Model.extend({
    tableName: 'uploads',
    hasTimestamps: true,
    order: function() {
      return this.belongsTo('Order', 'order');
    }
  }, {
    getAttributes: () => {
      return ['name', 'url', 'created_at', 'updated_at'];
    }
  });

module.exports = bookshelf.model('Upload', Upload);
