
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTableIfNotExists('uploads', (t) => {
      t.increments().primary();
      t.integer('order').unsigned().references('orders.id').notNullable();
      t.string('name');
      t.string('url');
      t.timestamps();
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTableIfExists('uploads')
  ]);
};
