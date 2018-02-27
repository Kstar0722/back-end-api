const dust = require('dustjs-linkedin');
require('dustjs-helpers');
const config = require('../config');
const url = require('url');
const bcrypt = require('bcrypt');
const randstr = require('randomstring');
const _ = require('lodash');
const querystring = require('querystring');

module.exports = {

  normalizeQuery(query, attributes){
    let filter = _.isPlainObject(query.filter) ? query.filter : {};
    filter = _.pick(filter, attributes);

    let page = _.isPlainObject(query.page) ? query.page : {};
    page = Object.assign({number: 1, size: 20}, _.pick(page, ['number', 'size']));

    if (page.number < 1) {
      page.number = 1;
    }
    if (page.size < 1) {
      page.size = 20;
    }

    let sort = [];
    if (query.sort){
      query.sort.split(',').forEach(field => {
        let direction = 'ASC';
        if (field.length > 0 && field[0] == '-'){
          direction = 'DESC';
          field = field.substr(1);
        }
        if (attributes.indexOf(field) > -1){
          sort.push({field, direction});
        }
      });
    }
    if (sort.length == 0){
      sort.push({field: 'created_at', direction: 'DESC'});
    }
    return {
      filter,
      page,
      sort
    }
  },

  fetchPaginationData(query, Model, withRelated){

    let preparedFetch = Model.forge();
    preparedFetch.where(query.filter);
    query.sort.forEach(sortItem => {
      preparedFetch.orderBy(sortItem.field, sortItem.direction);
    });

    return preparedFetch.fetchPage({
      page: query.page.number,
      pageSize: query.page.size,
      withRelated: withRelated
    });

  },

  getHomeUrl(req) {
    let url = req.protocol+'://'+req.headers.host;
    return url;
  },

  stringifyQuery(query) {
    let res = _.union(
      Object.keys(query.filter).map(key => "filter["+key+"]="+querystring.escape(query.filter[key])),
      Object.keys(query.page).map(key => "page["+key+"]="+querystring.escape(query.page[key]))
    );
    let sort = [];
    query.sort.forEach(item => {
      sort.push( (item.direction == 'DESC') ? "-"+item.field : item.field );
    });
    res.push("sort="+sort.join(','));
    return res.join('&');
  },

  genNavLinks(path, query, count){
    let links = {};
    let tmpQuery = _.cloneDeep(query);

    let lastPage = Math.floor(count / query.page.size);
    if (count % query.page.size > 0) {
      lastPage++;
    }
    if (query.page.number < 2) {
      links.first = null;
      links.prev = null;
    } else {
      tmpQuery.page.number = 1;
      links.first = path+"?"+this.stringifyQuery(tmpQuery);
      tmpQuery.page.number = query.page.number - 1;
      links.prev = path+"?"+this.stringifyQuery(tmpQuery);
    }
    if (query.page.number >= lastPage) {
      links.last = null;
      links.next = null;
    } else {
      tmpQuery.page.number = lastPage;
      links.last = path+"?"+this.stringifyQuery(tmpQuery);
      tmpQuery.page.number = query.page.number*1 + 1;
      links.next = path+"?"+this.stringifyQuery(tmpQuery);
    }
    return links;
  },

  hashPassword(password){
    return new Promise((resolve, reject) => {
      bcrypt.hash(password, 12, (err, hash) => {
        if (err) return reject(err);
        resolve(hash);
      });
    });
  },

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

  getS3Key(link, filename) {
    let key;
    if (link) {
      let pathname = url.parse(link).pathname;
      if (pathname) {
        key = pathname.split('/').pop();
      }
    }
    if (!key) {
      key = randstr.generate({length: 20, capitalization: "lowercase"})+"."+filename.split('.').pop();
    }
    return key;
  }

};
