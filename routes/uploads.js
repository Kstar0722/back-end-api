//let router = express.Router(),
let express = require('express'),
    router = express.Router()
    Order = require('../models').order,
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
  Order.forge({id: req.body.order}).fetch({
    withRelated: ['user']
  }).then((order) => {
    if (!order.attributes.pdf) {
      res.send(500, {status: "error", massage: "order doesn't contain the pdf"});
    }
    let email = (order.relations.user) ? order.relations.user.attributes.email : null;
    if (!email){
      res.send(500, {status: "error", massage: "has no user or email"});
    }
    helper.sendEmail(email, "pdf", order.toJSON(), function (err, body){
      if (err){
        res.send(500, {status: "error", massage: "Sending email: " + err.message});
      } else {
        res.json({status: "ok"});
      }
    })

  })
});

router.post('/', (req, res) => {
  if (!req.body.order){
    res.send(500, {status: "error", massage: "order is required"});
  }
  Order.forge({id: req.body.order}).fetch({
    withRelated: ['user']
  }).then((order) => {
    if (!order) {
      res.send(500, {status: "error", massage: "order not found"});
    }
    let key;
    if (order.attributes.pdf) {
      let pathname = url.parse(order.attributes.pdf).pathname;
      if (pathname) {
        key = pathname.split('/').pop();
      }
    }
    if (!key) {
      key = randstr.generate({length: 20, capitalization: "lowercase"})+".pdf";
    }

    req.file('pdf').upload(function (err, uploadedFiles){
      if (err) return res.send(500, err);
      if (!uploadedFiles || !uploadedFiles[0]){
        res.send(500, {status: "error", massage: "file not uploaded"});
      }

      let upload = s3.uploadFile({
        localFile: uploadedFiles[0].fd,
        s3Params: {
          ACL: 'public-read',
          Bucket: 'iifym-blueprints',
          Key: key
        }
      });
      upload.on('error', function(err) {
        res.send(500, err);
        return;
      });
      upload.on('end', function(output) {
        let fn = 'https://s3-us-west-2.amazonaws.com/iifym-blueprints/' + key;
        let email = (order.relations.user) ? order.relations.user.attributes.email : null;
        Order.where({id: req.body.order}).save({pdf: fn}, {patch: true}).then((order) => {
          if (email && req.body.send_email_notification){
            helper.sendEmail(email, "pdf", {pdf: fn}, function (err, body){
              // console.log(err, body)
            })
          }
          return res.json(new Serializer('upload', {
            id: 'id',
            attributes: ['pdf'],
            keyForAttribute: 'snake_case'
          }).serialize(Object.assign({}, order.toJSON(), {id: req.body.order})));
        }, (err) => {
          return res.status(500).json({
            message: 'Server error occurred'
          });
        });
      });

    });
  })
  .catch(err => res.status(500).send(err));
});

module.exports = router;
