var express = require('express'),
    bodyParser = require('body-parser'),
    fs = require('fs'),
    promise = require('bluebird'),
    interfacesApi = require('./api/interfaces.js'),
    pluginsApi = require('./api/plugins.js'),
    prefsApi = require('./api/prefs.js');

module.exports = {
    init: function(api, options){
        var app = express(),
            router = express.Router(),
            endpoints = {
                interfaces: new interfacesApi(options),
                plugins: new pluginsApi(options),
                prefs: new prefsApi(options)
            };

        app.use(bodyParser.urlencoded({extended: true}));
        app.use(bodyParser.json());
        app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

        router.param('endpoint', function(req, res, next, endpoint){
            req.endpoint = endpoints[endpoint];
            return next();
        });

        router.all('/api/:endpoint*', function(req, res) {
            var urlParams = req.params[0].split('/');
            urlParams.shift();
            promise.join(req.endpoint[req.method.toLowerCase()](urlParams, req.body), function(data){
                res.send(data);
            });
        });

        router.get('/*', function(req, res){
            var path = req.params[0] && fs.existsSync('./admin/dist/'+req.params[0])? req.params[0] : 'index.html';
            res.sendFile(path, {root: './admin/dist'});
        });

        app.use('/', router);

        options.basePrefs.findOneAsync({name: 'port'}).done(function(doc){
            app.listen(doc.value);
        });
    }
}
