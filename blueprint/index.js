let Order = require('../models/order'),
    _ = require('underscore'),
    util = require('util'),
    tmp = require('tmp'),
    s3 = require('s3').createClient({
      s3Options: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
        region: 'us-west-2'
      }
    });

module.exports = {

  calculate: function(variables) {
    let result = {};

    // S 14
    let fat_opt ;
    if (variables.current_weight < 126) {
      fat_opt = 1;
    } else if (variables.current_weight < 176) {
      fat_opt = 2;
    } else if (variables.current_weight < 201) {
      fat_opt = 3;
    } else if (variables.current_weight < 231) {
      fat_opt = 4;
    } else if (variables.current_weight < 261) {
      fat_opt = 5;
    } else if (variables.current_weight < 301) {
      fat_opt = 6;
    } else {
      fat_opt = 7;
    }
    // S 15 => D14
    let fat;
    switch(fat_opt){
      case 1:
        fat = variables.current_weight * 0.4;
        break;
      case 2:
        fat = 50 + (variables.current_weight - 125) * 0.35 * 0.4;
        break;
      case 3:
        fat = 50 + 17.5 +(variables.current_weight - 175) * 0.3;
        break;
      case 4:
        fat = 50 + 17.5 + 7.5 + (variables.current_weight - 200) * 0.25;
        break;
      case 5:
        fat = 50 + 17.5 + 7.5 + 7.5 + (variables.current_weight - 230) * 0.2;
        break;
      case 6:
        fat = 50 + 17.5 + 7.5 + 7.5 + 6 + (variables.current_weight - 260) * 0.15;
        break;
      case 7:
        fat = 50 + 17.5 + 7.5 + 7.5 + 6 + 6 + (variables.current_weight - 300) * 0.1;
        break;
    }

    // T14
    let carbs_opt;
    if (variables.current_weight < 161) {
      carbs_opt = 1;
    } else if (variables.current_weight < 201) {
      carbs_opt = 2;
    } else if (variables.current_weight < 251) {
      carbs_opt = 3;
    } else {
      carbs_opt = 4;
    }
    // T15  => D13
    let carbs;
    switch(fat_opt){
      case 1:
        carbs = variables.current_weight;
        break;
      case 2:
        carbs = 160 + (variables.current_weight - 160) * 0.7;
        break;
      case 3:
        carbs = 160 + 28 + (variables.current_weight - 200) * 0.5;
        break;
      case 4:
        carbs = 160 + 28 + 25 + (variables.current_weight - 250) * 0.35;
        break;
    }

    // D12
    let protein = variables.target_weight;

    // A
    result.protein_grams_per_day = 0;
    // B
    result.carb_grams_per_day = 0;
    //variables.activity_level : none, moderate, high, high
    switch (variables.activity_level){
      case 'moderate':
        result.protein_grams_per_day = variables.target_weight;
        result.carb_grams_per_day = carbs;
        break;
      case 'high':
        result.protein_grams_per_day = variables.target_weight;
        result.carb_grams_per_day = carbs * 1.1;
        break;
      case 'veryhigh':
        result.protein_grams_per_day = variables.target_weight * 1.1;
        result.carb_grams_per_day = carbs * 1.2;
        break;
      default: // 'none'
        result.protein_grams_per_day = variables.target_weight * 0.95;
        result.carb_grams_per_day = carbs * 0.9;
    }
    // C
    result.fat_grams_per_day = fat;

    // D
    result.water_leters_per_day = 3;

    // F
    result.calories_allowed = fat * 9 +  result.carb_grams_per_day * 4 + result.protein_grams_per_day * 4;

    // if_tracking_macros_carbohydrates is not required
    if (variables.if_tracking_macros_carbohydrates){
      // H
      result.carbs_currently_consumed = variables.if_tracking_macros_carbohydrates;

      // I
      result.first_week_carbs = result.carbs_currently_consumed * 1.35;

      // II
      result.carbs_to_add_weekly = result.carbs_currently_consumed * 1.65;

      // J
      result.max_carbs_goal = result.carbs_currently_consumed * 2;
    }

    let final_protein = 35;
    // K
    result.refeed_protein = Math.round(final_protein * 0.8);

    let final_carbs = 130;
    // L
    result.refeed_carbs = final_carbs * 1.5;

    let final_fat = 10;
    // M
    result.refeed_fats = final_fat * 0.8;

    // N
    result.non_refeed_low_protein =  result.protein_grams_per_day; // A

    // O
    result.non_refeed_low_carbs =  50; // "50 grams"

    // P
    result.non_refeed_low_fats =  25; // "50 grams"

    // PP
    result.low_grams_of_carbs_for_change =  result.carb_grams_per_day * 0.4;// B * 0.4

    // PPP
    let loss_weight_per_week;
    if (variables.current_weight < 150) {
      loss_weight_per_week = variables.current_weight * 0.006;
    } else if (variables.current_weight < 250) {
      loss_weight_per_week = variables.current_weight * 0.0065;
    } else if (variables.current_weight < 300) {
      loss_weight_per_week = variables.current_weight * 0.0075;
    } else if (variables.current_weight < 350) {
      loss_weight_per_week = variables.current_weight * 0.0085;
    } else {
      loss_weight_per_week = variables.current_weight * 0.01;
    }
    let length_of_weeks_from_start = (variables.current_weight - variables.target_weight) / loss_weight_per_week
    result.length_of_months_from_start =  length_of_weeks_from_start / 4;

    result.pregnant = (variables.are_you_pregnant_or_nursing == 'yes_i_am_pregnant');

    Object.keys(result).forEach(key => {result[key] = (typeof result[key] === "number") ? Math.round(result[key]) : result[key];});
    return result;
  },

  renderTemplate: function(variables, callback) {
    let dir = path.join(__dirname, '..', 'templates', 'blueprint.html');
    fs.readFile(dir, (err, template) => {
      if(err) {
        return res.status(500).json({
          error: {
            message: 'Server error occurred'
          }
        });
      }
      // will be removed
//      variables = Object.assign({}, variables, this.calculate(variables));
      dust.renderSource(template.toString(), variables, (err, rendered) => {
        if(err) {
          callback(err);
          return;
        }
        callback(null, rendered);
        return;
        /*return res.pdfFromHTML({
          filename: 'blueprint.pdf',
          htmlContent: rendered
        });*/
      });
    });
  },

  create: function(order, callback) {
    let _this = this;
    Order.forge({
      id: order
    }).fetch({
      withRelated: ['infos', 'details']
    }).then((order) => {
      let infos = _this.formatInfos(_.map(order.toJSON().infos));
      let details = _.omit(order.toJSON().details, ['id', 'order', 'created_at', 'updated_at']);
      infos = Object.assign({}, infos, details);
      _this.renderTemplate(infos, function(err, template) {
        if(err) {
          callback(err);
          return;
        }
        tmp.file(function(err, path, fd, cleanup) {
          if(err) {
            cleanup();
            callback(err);
            return;
          }
          fs.write(fd, template, 0, 'utf8', function(err, bytes, str) {
            if(err) {
              callback(err);
              return;
            }
            let upload = s3.uploadFile({
              localFile: path,
              s3Params: {
                Bucket: 'iifym-blueprints',
                Key: util.format('%s.html', order.ger('id'))
              }
            });
            upload.on('error', function(err) {
              callback(err);
              cleanup();
              return;
            });
            upload.on('end', function(output) {
              callback(null, output);
              cleanup();
              return;
            });
          });
        });
      });
    }).catch((err) => {
      callback(err);
      return;
    });
  },

  formatInfos: (infos) => {
    let result = {};
    _.each(infos, (info) => {
      result[info.key] = info.value;
    });
    return result;
  }
};
