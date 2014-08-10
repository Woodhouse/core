var fs = require("fs");
var promise = require('bluebird');
var nedb = require('nedb');
var interfacePrefs = new nedb({ filename: 'interface-prefs.db', autoload: true });
var pluginPrefs = new nedb({ filename: 'plugin-prefs.db', autoload: true });
promise.promisifyAll(interfacePrefs);
promise.promisifyAll(pluginPrefs);
var deps = {
    promise: promise,
    interfacePrefs: interfacePrefs,
    pluginPrefs: pluginPrefs
};
var api = require('./lib/api')(deps);

require('./lib/yesno.js')(api);
require('./admin/')(deps)

fs.readdirSync("./interfaces").forEach(function(file) {
    fs.stat("./interfaces/" + file, function(err, stats){
        if (stats.isDirectory()) {
            api.loadInterface(file);
        }
    });
});

fs.readdirSync("./plugins").forEach(function(file) {
    fs.stat("./plugins/" + file, function(err, stats){
        if (stats.isDirectory()) {
            api.loadPlugin(file);
        }
    });
});

