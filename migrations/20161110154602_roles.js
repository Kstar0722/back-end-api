
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTableIfNotExists('roles', (t) => {
      t.increments().primary();
      t.string('role', 128).unique().notNullable();
    }).then(() => {
      return knex('roles').insert([
        {
          id: 1,
          role: 'customer'
        },
        {
          id: 2,
          role: 'admin'
        }
      ]);
    }),
    knex.schema.table('users', (t) => {
      t.integer('role').unsigned().references('roles.id').defaultsTo(1).notNullable();
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('users', (t) => {
      t.dropColumn('role')
    }),
    knex.schema.dropTableIfExists('roles')
  ]);
};
