'use strict';

let fs = require('fs'),
	path = require('path'),
	routes = {};

fs.readdirSync(__dirname).filter(function(file) {
    return file !== path.basename(__filename)
}).forEach(function(file) {
	let name = path.parse(file).name;
    routes[name] = require(`./${name}`);
});

module.exports = routes;