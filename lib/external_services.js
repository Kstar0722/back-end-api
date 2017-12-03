const mailgun = require('mailgun-js')({
        apiKey: process.env.MAILGUN_KEY,
        domain: 'iifym.com'
      });
const s3 = require('s3').createClient({
        s3Options: {
          accessKeyId: process.env.S3_ACCESS_KEY,
          secretAccessKey: process.env.S3_SECRET_KEY,
          region: 'us-west-2'
        }
      });


module.exports = {

  sendEmail(email, subject, html, cb) {
    mailgun.messages().send({
      from: 'IIFYM <accounts@iifym.com>',
      to: email,
      subject: subject,
      html: html
    }, cb);
  },

  UploadFileS3(fd, key) {

    return new Promise((resolve, reject) => {
      let uploader = s3.uploadFile({
        localFile: fd,
        s3Params: {
          ACL: 'public-read',
          Bucket: 'iifym-blueprints',
          Key: key
        }
      });
      uploader.on('error', (err) => {
        reject(err);
      });
      uploader.on('progress', () => {
      });
      uploader.on('end', (data) => {
        resolve(data)
      });
    })

  }

};