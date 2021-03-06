'use strict';

let fs = require('fs'),
  path = require('path'),
  routes = {},
  name;

fs.readdirSync(__dirname).filter((file) => {
  return file !== path.basename(__filename)
}).forEach((file) => {
  name = path.parse(file).name;
  routes[name] = require(`./${name}`);
});

module.exports = routes;
