var promise = require('bluebird');
var nedb = require('nedb');
var Upgrade = require('./upgrade/upgrade.js');
var version = require('./lib/version.js');
var systemData = new nedb({ filename: 'system-data.db', autoload: true });
var interfacePrefs = new nedb({ filename: 'interface-prefs.db', autoload: true });
var pluginPrefs = new nedb({ filename: 'plugin-prefs.db', autoload: true });
var basePrefs = new nedb({ filename: 'base-prefs.db', autoload: true });
var users = new nedb({ filename: 'users.db', autoload: true });
var api = require('./lib/api');
promise.promisifyAll(interfacePrefs);
promise.promisifyAll(pluginPrefs);
promise.promisifyAll(basePrefs);
promise.promisifyAll(users);
promise.promisifyAll(systemData);

var apiObject = {
        promise: promise,
        interfacePrefs: interfacePrefs,
        pluginPrefs: pluginPrefs,
        basePrefs: basePrefs,
        users: users
    };

systemData.findOneAsync({name: 'version'}).then(function(doc) {
    if (!doc) {
        return systemData.insertAsync({name: 'version', value: '0.0.0'});
    } else {
        return doc;
    }
}).then(function(doc) {
    var upgrade = new Upgrade(apiObject);
    return upgrade.run(doc.value);
}).then(function() {
    return systemData.updateAsync({name: 'version'}, {$set: {value: version.full}});
}).then(function() {
    return basePrefs.findOneAsync({name: 'name'});
}).then(function(doc){
    var thisApi;

    apiObject.name = doc.value;

    thisApi = new api(apiObject);
    require('./lib/core_listeners.js')(thisApi, users);
    require('./admin/')(apiObject)

    thisApi.getModules();
})
