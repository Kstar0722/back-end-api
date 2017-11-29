
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTableIfNotExists('blueprint_details', (t) => {
      t.increments().primary();
      t.integer('order').unsigned().references('orders.id').notNullable();
      t.integer('protein_grams_per_day');
      t.integer('carb_grams_per_day');
      t.integer('fat_grams_per_day');
      t.integer('water_leters_per_day');
      t.integer('calories_allowed');
      t.integer('carbs_currently_consumed');
      t.integer('first_week_carbs');
      t.integer('carbs_to_add_Weekly');
      t.integer('max_carbs_goal');
      t.integer('refeed_protein');
      t.integer('refeed_carbs');
      t.integer('refeed_fats');
      t.integer('non_refeed_low_protein');
      t.integer('non_refeed_low_carbs');
      t.integer('non_refeed_low_fats');
      t.integer('low_grams_of_carbs_for_change');
      t.integer('length_of_months_from_start');
      t.boolean('pregnant');
      t.timestamps();
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTableIfExists('blueprint_details')
  ]);
};
