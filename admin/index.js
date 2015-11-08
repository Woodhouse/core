module.exports = {
    init: function(api, options){
        var express = require('express'),
            app = express(),
            bodyParser = require('body-parser'),
            fs = require('fs'),
            interfacePrefs = options.interfacePrefs,
            pluginPrefs = options.pluginPrefs,
            basePrefs = options.basePrefs,
            promise = require('bluebird'),
            deps = options,
            router = express.Router(),
            endpoints = {
                interfaces: new (require('./api/interfaces.js'))(deps),
                plugins: new (require('./api/plugins.js'))(deps),
                prefs: new (require('./api/prefs.js'))(deps)
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

        basePrefs.findOneAsync({name: 'port'}).done(function(doc){
            app.listen(doc.value);
        });
    }
}
