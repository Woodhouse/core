var fs = require("fs");
var promise = require('bluebird');
var nedb = require('nedb');
var interfacePrefs = new nedb({ filename: 'interface-prefs.db', autoload: true });
var pluginPrefs = new nedb({ filename: 'plugin-prefs.db', autoload: true });
var basePrefs = new nedb({ filename: 'base-prefs.db', autoload: true });
promise.promisifyAll(interfacePrefs);
promise.promisifyAll(pluginPrefs);
promise.promisifyAll(basePrefs);

basePrefs.findOneAsync({name: 'name'}).done(function(doc){
    var api = require('./lib/api')({
        promise: promise,
        interfacePrefs: interfacePrefs,
        pluginPrefs: pluginPrefs,
        basePrefs: basePrefs,
        name: doc.value
    });

    require('./lib/yesno.js')(api);
    require('./admin/')({
        promise: promise,
        interfacePrefs: interfacePrefs,
        pluginPrefs: pluginPrefs,
        basePrefs: basePrefs,
        api: api
    })

    var moduleTypes = ['interfaces', 'plugins'];
    for (var i = 0, len = moduleTypes.length; i < len; i++) {
        fs.readdirSync("./" + moduleTypes[i]).forEach(function(file) {
            if (fs.statSync("./" + moduleTypes[i] + "/" + file).isDirectory()) {
                api.loadModule(file, moduleTypes[i]);
            }
        });
    }
});
