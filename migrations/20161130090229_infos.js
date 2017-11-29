
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTableIfNotExists('infos', (t) => {
      t.increments().primary();
      t.string('key').notNullable();
      t.string('value').notNullable();
      t.integer('order').unsigned().references('orders.id').notNullable();
      t.timestamps();
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTableIfExists('infos')
  ]);
};
