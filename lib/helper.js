const dust = require('dustjs-linkedin');
require('dustjs-helpers');
const config = require('../config');
const url = require('url');
const randstr = require('randomstring');

module.exports = {

  sendEmail(email, template, data){
    return new Promise((resolve, reject) => {
      require('fs').readFile(require('path').join(__dirname, '..', 'templates', template + '.html'), (err, content) => {
        if (err) return reject(err);
        var compiled = dust.compile(content.toString(), 'pdf');
        dust.loadSource(compiled);
        dust.render('pdf', data, function (err, output) {
          if (err) return reject(err);
          require('fs').writeFileSync('./a.html', output)
          ExternalServices.sendEmail(email, 'Your IIFYM Notification', output, (err, body) => {
            if (err) return reject(err);
            return resolve(body);
          });
        });
      });
    });
  },

  getS3Link(key) {
    return `https://s3-${config.s3_region}.amazonaws.com/${config.s3_bucket}/${key}`;
  },

  getS3Key(link) {
    let key;
    if (link) {
      let pathname = url.parse(link).pathname;
      if (pathname) {
        key = pathname.split('/').pop();
      }
    }
    if (!key) {
      key = randstr.generate({length: 20, capitalization: "lowercase"})+".pdf";
    }
    return key;
  }

};
