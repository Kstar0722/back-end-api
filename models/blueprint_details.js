'use strict';

let bookshelf = require('../database'),
  BlueprintDetails = bookshelf.Model.extend({
    tableName: 'blueprint_details',
    hasTimestamps: true,
    order: function() {
      return this.belongsTo('Order', 'order');
    }
  }, {
    getAttributes: () => {
      return ['protein_grams_per_day',
        'carb_grams_per_day',
        'fat_grams_per_day',
        'water_leters_per_day',
        'calories_allowed',
        'carbs_currently_consumed',
        'first_week_carbs',
        'carbs_to_add_Weekly',
        'max_carbs_goal',
        'refeed_protein',
        'refeed_carbs',
        'refeed_fats',
        'non_refeed_low_protein',
        'non_refeed_low_carbs',
        'non_refeed_low_fats',
        'low_grams_of_carbs_for_change',
        'length_of_months_from_start',
        'pregnant']
    }
  });

module.exports = bookshelf.model('BlueprintDetails', BlueprintDetails);
