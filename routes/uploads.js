//let router = express.Router(),
let express = require('express'),
    router = express.Router()
    Order = require('../models').order,
    Upload = require('../models').upload,
    JSONAPI = require('jsonapi-serializer'),
    Serializer = JSONAPI.Serializer,
    randstr = require('randomstring'),
    helper = require('../lib/helper'),
    s3 = require('s3').createClient({
      s3Options: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
        region: 'us-west-2'
      }
    }),
    url = require('url')

  ;

router.post('/resend', (req, res) => {
  if (!req.body.order){
    res.send(500, {status: "error", massage: "order is required"});
  }
  if (!req.body.name){
    res.send(500, {status: "error", massage: "name is required"});
  }
  Order.forge({id: req.body.order}).fetch({
    withRelated: ['user', 'uploads']
  }).then((order) => {
    let uploads = order.relations.uploads.filter(upload => upload.attributes.name == req.body.name);
    if (uploads.length == 0) {
      res.send(500, {status: "error", massage: "order doesn't contain required pdf"});
    }
    let email = (order.relations.user) ? order.relations.user.attributes.email : null;
    if (!email){
      res.send(500, {status: "error", massage: "has no user or email"});
    }
    helper.sendEmail(email, "pdf", {pdf: uploads[0].attributes.url}, function (err, body){
      console.log(err, body)
      if (err){
        res.send(500, {status: "error", massage: "Sending email: " + err.message});
      } else {
        res.json({status: "ok"});
      }
    });
  })
});

router.post('/', (req, res) => {
  if (!req.body.order){
    res.send(500, {status: "error", massage: "order is required"});
  }
  if (!req.body.name){
    res.send(500, {status: "error", massage: "file name is required"});
  }
  let order,
    upload,
    fn,
    key;

  Order.forge({id: req.body.order}).fetch({
    withRelated: ['user']
  }).then((_order) => {
    order = _order;
    if (!order) {
      res.send(500, {status: "error", massage: "order not found"});
    }
    return Upload.forge({
      order: req.body.order,
      name: req.body.name,
    }).fetch();
  }).then((_upload) => {
    upload = _upload;
    if (upload) {
      let pathname = url.parse(upload.attributes.url).pathname;
      if (pathname) {
        key = pathname.split('/').pop();
      }
    }
    if (!key) {
      key = randstr.generate({length: 20, capitalization: "lowercase"})+".pdf";
    }

    return new Promise((resolve, reject) => {
      req.file('pdf').upload(function (err, uploadedFiles){
        if (err) return reject(err);
        if (!uploadedFiles || !uploadedFiles[0]){
          return reject(new Error("file not uploaded"));
        }
        resolve(uploadedFiles[0]);
      });
    });
  }).then((uploadedFile) => {
    return s3.uploadFile({
      localFile: uploadedFile.fd,
      s3Params: {
        ACL: 'public-read',
        Bucket: 'iifym-blueprints',
        Key: key
      }
    });
  }).then((output) => {
    // TODO
    fn = 'https://s3-us-west-2.amazonaws.com/iifym-blueprints/' + key;
    if (upload) {
      return Promise.resolve(upload);
    } else {
      return Upload.forge().save({order: req.body.order, name: req.body.name, url: fn}, {method: "insert"});
    }
  }).then((upload) => {
    let email = (order.relations.user) ? order.relations.user.attributes.email : null;
    if (email && req.body.send_email_notification){
      helper.sendEmail(email, "pdf", {pdf: fn}, function (err, body){
          // console.log(err, body)
      })
    }
    return res.json(new Serializer('upload', {
      id: 'id',
      attributes: ['order', 'name', 'url'],
      keyForAttribute: 'snake_case'
    }).serialize(upload.toJSON()));
  }).catch((err) => {
    res.send(500, err);
  });

});

module.exports = router;
