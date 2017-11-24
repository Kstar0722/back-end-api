'use strict';

let bookshelf = require('../database'),
  Role = bookshelf.Model.extend({
    tableName: 'roles',
    user: function() {
      return this.hasMany('User', 'role');
    }
  }, {
    getAttributes: () => {
      return ['role'];
    }
  });

module.exports = bookshelf.model('Role', Role);
