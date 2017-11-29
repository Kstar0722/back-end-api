let mailgun = require('mailgun-js')({
      apiKey: process.env.MAILGUN_KEY,
      domain: 'iifym.com'
    }),
    dust = require('dustjs-linkedin');

module.exports = {

  sendEmail(email, template, data, cb){
    require('fs').readFile(require('path').join(__dirname, '..', 'templates', template+'.html'), (err, content) => {
      if (err) return cb(err);
      var compiled = dust.compile(content.toString(), 'pdf');
      dust.loadSource(compiled);
      dust.render('pdf', data, function(err, output) {
        if (err) return cb(err);
        mailgun.messages().send({
          from: 'IIFYM <accounts@iifym.com>',
          to: email,
          subject: 'Your IIFYM Notification',
          html: output
        }, (err, body) => {
          if (err) return cb(err);
          return cb(null, body);
        });
      });
    });
  }

}
