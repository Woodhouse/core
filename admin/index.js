module.exports = function(options){
    var express = require('express');
    var app = express();
    var bodyParser = require('body-parser');
    var fs = require('fs');
    var interfacePrefs = options.interfacePrefs,
        pluginPrefs = options.pluginPrefs,
        basePrefs = options.basePrefs,
        promise = options.promise,
        api = options.api,
        deps = options;

    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());
    app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

    var router = express.Router();

    router.param('endpoint', function(req, res, next, endpoint){
        var endpoint = require('./api/'+endpoint);
        req.endpoint = new endpoint(deps)
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
