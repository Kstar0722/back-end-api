'use strict';

let express = require('express'),
    app = express(),
    path = require('path'),
    bodyParser = require('body-parser'),
    router = express.Router(),
    routes = require('./routes'),
    jwt = require('express-jwt'),
    config = require('./config'),
    pgp = require('pg-promise')({
        promiseLib: require('bluebird')
    }),
    db = pgp({
        host: config.db.host,
        port: config.db.port,
        database: config.db.name,
        user: config.db.user,
        password: config.db.pass
    });

app.set('pgp', pgp);
app.set('db', db);
app.use(bodyParser.json());
app.use(jwt({
    secret: process.env.TOKEN_SECRET || 'secret'
}).unless({
    path: [
        {
            url: '/auth',
            methods: ['POST']
        },
        {
            url: '/users',
            methods: ['POST']
        },
        {
            url: '/users/create',
            methods: ['POST']
        }
    ]
}));
Object.keys(routes).forEach(function(route) {
    router.use(`/${route}`, routes[route]);
});
app.use(router);
db.none(pgp.QueryFile(path.join(__dirname, 'queries', 'tables.sql'), {
    minify: true
})).then(() => {
    let listener = app.listen(process.env.PORT || 3000, () => {
        let address = listener.address();
        console.info(`Started server on ${address.address}${address.port}!`);
    });
}).catch(() => {
    console.error('Error initializing tables.');
});
