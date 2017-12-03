//let router = express.Router(),
let express = require('express'),
    router = express.Router(),
    Order = require('../models').order,
    Upload = require('../models').upload,
    JSONAPI = require('jsonapi-serializer'),
    Serializer = JSONAPI.Serializer,
    helper = require('../lib/helper'),
    config = require('../config'),
    _ = require('underscore')
  ;

router.post('/resend', (req, res) => {
  if (!req.body.order){
    res.send(500, {status: "error", massage: "order is required"});
  }
  Order.forge({id: req.body.order}).fetch({
    withRelated: ['user', 'uploads']
  }).then((order) => {
    let uploads = order.relations.uploads;
    if (req.body.name) {
      let names = _.isArray(req.body.name) ? req.body.name : [req.body.name];
      uploads = order.relations.uploads.filter(upload => names.indexOf(upload.attributes.name) > -1);
    }
    let links = uploads.map(upload => ({name: upload.attributes.name, url: upload.attributes.url}));
    if (links.length == 0) {
      res.send(500, {status: "error", massage: "order doesn't contain required pdf"});
    }
    let email = (order.relations.user) ? order.relations.user.attributes.email : null;
    if (!email) {
      res.send(500, {status: "error", massage: "has no user or email"});
    }
    return helper.sendEmail(email, "pdf", {name: order.relations.user.attributes.first_name, links, login_url: `http://${config.domain}/${config.dashboard_url}`});
  }).then((body) =>{
    res.json({status: "ok"});
  }).catch((err) => {
    res.status(500).send(err);
  });
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
    key = helper.getS3Key((upload) ? upload.attributes.url : null);
    ExternalServices.UploadFileS3(uploadedFile.fd, key)
  }).then((output) => {
    if (upload) {
      return Promise.resolve(upload);
    } else {
      return Upload.forge().save({order: req.body.order, name: req.body.name, url: helper.getS3Link(key)}, {method: "insert"});
    }
  }).then((upload) => {
    return res.json(new Serializer('upload', {
      id: 'id',
      attributes: ['order', 'name', 'url'],
      keyForAttribute: 'snake_case'
    }).serialize(upload.toJSON()));
  }).catch((err) => {
    res.status(500).send(err);
  });

});

module.exports = router;
