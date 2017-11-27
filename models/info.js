'use strict';

let bookshelf = require('../database'),
  Info = bookshelf.Model.extend({
    tableName: 'infos',
    hasTimestamps: true,
    user: function() {
      return this.belongsTo('User', 'user');
    }
  }, {
    getAttributes: () => {
      return ['key', 'value', 'created_at', 'updated_at'];
    }
  });

module.exports = bookshelf.model('Info', Info);
