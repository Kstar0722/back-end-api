'use strict';

let bookshelf = require('../database'),
  Info = bookshelf.Model.extend({
    tableName: 'infos',
    hasTimestamps: true,
    order: function() {
      return this.belongsTo('Order', 'order');
    }
  }, {
    getAttributes: () => {
      return ['key', 'value', 'created_at', 'updated_at'];
    }
  });

module.exports = bookshelf.model('Info', Info);
