'use strict';

exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTableIfNotExists('orders', (t) => {
      t.increments().primary();
      t.integer('customer').unsigned().references('users.id').notNullable();
      t.string('product', 512).notNullable(512);
      t.decimal('price');
      t.string('status').defaultTo('Received').notNullable();
      t.timestamps();
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTableIfExists('orders')
  ]);
};
