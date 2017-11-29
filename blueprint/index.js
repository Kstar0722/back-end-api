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
    const protein_koef = {none: 0.8, moderate: 0.9, high: 1};
    const carbs_koef = {
      male:   {none: 1.2, moderate: 1.4, high: 1.6},
      female: {none: 1, moderate: 1.2, high: 1.4},
    };
    result.protein_grams_per_day = variables.target_weight * protein_koef[variables.activity_level];
    result.carb_grams_per_day = variables.current_weight * carbs_koef[variables.gender][variables.activity_level];
    if(variables.gender == 'male') {
      result.fat_grams_per_day = variables.current_weight > 350 ? variables.current_weight * .3 : variables.current_weight * .28;
    } else {
      if(variables.current_weight > 200) {
        result.fat_grams_per_day = variables.current_weight * .4;
      } else if(variables.current_weight <= 201 && variables.current_weight >= 250) {
        result.fat_grams_per_day = variables.current_weight * .375;
      } else if(variables.current_weight < 250 && variables.current_weight >= 300) {
        result.fat_grams_per_day = variables.current_weight * .35;
      } else {
        result.fat_grams_per_day = variables.current_weight * .325;
      }
    }
    // TODO
    /*
    result.default_calories = {
      protein: result.default_protein * 4,
      carbs: result.default_carbs * 4,
      fat: result.default_fat * 9
    };
    */
    //result.default_coefficient = variables.current_weight * 11;
    result.refeed_fats = result.fat_grams_per_day * 0.8;
    result.refeed_carbs = result.carb_grams_per_day * 1.6;
    result.refeed_protein = result.protein_grams_per_day * 0.8;

    Object.keys(result).forEach(key => {result[key] = Math.round(result[key])})
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
