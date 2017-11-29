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
      variables.default_protein = {
        none: variables.target_weight * 0.8,
        moderate: variables.target_weight * 0.9,
        high: variables.target_weight * 1
      };
      variables.default_protein = variables.default_protein[variables.activity_level];
      variables.default_carbs = {
        male: {
          none: variables.current_weight * 1.2,
          moderate: variables.current_weight * 1.4,
          high: variables.current_weight * 1.6
        },
        female: {
          none: variables.current_weight * 1,
          moderate: variables.current_weight * 1.2,
          high: variables.current_weight * 1.4
        }
      };
      variables.default_carbs = variables.default_carbs[variables.gender][variables.activity_level];
      if(variables.gender == 'male') {
        variables.default_fat = variables.current_weight > 350 ? variables.current_weight * .3 : variables.current_weight * .28;
      } else {
        if(variables.current_weight > 200) {
          variables.default_fat = variables.current_weight * .4;
        } else if(variables.current_weight <= 201 && variables.current_weight >= 250) {
          variables.default_fat = variables.current_weight * .375;
        } else if(variables.current_weight < 250 && variables.current_weight >= 300) {
          variables.default_fat = variables.current_weight * .35;
        } else {
          variables.default_fat = variables.current_weight * .325;
        }
      }
      variables.default_calories = {
        protein: variables.default_protein * 4,
        carbs: variables.default_carbs * 4,
        fat: variables.default_fat * 9
      };
      variables.default_coefficient = variables.current_weight * 11;
      variables.refeed_macros_fat = variables.default_fat * 0.8;
      variables.refeed_macros_carbs = variables.default_carbs * 1.6;
      variables.refeed_macros_protein = variables.default_protein * 0.8;
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
      withRelated: ['infos']
    }).then((order) => {
      let infos = _this.formatInfos(_.map(order.toJSON().infos));
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
