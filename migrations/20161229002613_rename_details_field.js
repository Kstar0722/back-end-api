
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('blueprint_details', function (table) {
      table.renameColumn('carbs_to_add_Weekly', 'carbs_to_add_weekly');
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('blueprint_details', function (table) {
      table.renameColumn('carbs_to_add_weekly', 'carbs_to_add_Weekly');
    })
  ]);
};
