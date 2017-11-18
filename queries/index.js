'use strict';

let fs = require('fs'),
	path = require('path');

function getQueries(directory, pgp) {
	let files = {}, dir;
	fs.readdirSync(directory).filter((file) => {
		return file !== 'index.js';
	}).forEach((file) => {
		dir = path.join(directory, file);
		if(path.extname(dir) === '') {
			files[path.basename(dir)] = getQueries(dir, pgp);
		} else {
			files[path.basename(file, path.extname(file))] = pgp.QueryFile(dir, {
				minify: true
			});
		}
	});
	return files;
}

module.exports = (pgp) => {
	return getQueries(__dirname, pgp);
};