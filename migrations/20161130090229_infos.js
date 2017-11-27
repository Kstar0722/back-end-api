
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTableIfNotExists('infos', (t) => {
      t.increments().primary();
      t.string('key').notNullable();
      t.string('value').notNullable();
      t.integer('user').unsigned().references('users.id').notNullable();
      t.timestamps();
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTableIfExists('infos')
  ]);
};
