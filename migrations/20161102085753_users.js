'use strict';

exports.up = (knex, Promise) => {
  return Promise.all([
    knex.schema.createTableIfNotExists('users', (t) => {
      t.increments().primary();
      t.string('first_name', 128).notNullable();
      t.string('last_name', 128).notNullable();
      t.string('email').unique().notNullable();
      t.string('password', 72).notNullable();
      t.timestamps();
    })
  ]);
};

exports.down = (knex, Promise) => {
  return Promise.all([
    knex.schema.dropTableIfExists('users')
  ]);
};
