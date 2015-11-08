var promise = require('bluebird'),
    nedb = require('nedb'),
    Upgrade = require('./upgrade/upgrade.js'),
    version = require('./lib/version.js'),
    api = require('./lib/api'),
    core_listeners = require('./lib/core_listeners.js'),
    admin = require('./admin/index.js'),
    systemData = promise.promisifyAll(new nedb({ filename: 'system-data.db', autoload: true })),
    interfacePrefs = promise.promisifyAll(new nedb({ filename: 'interface-prefs.db', autoload: true })),
    pluginPrefs = promise.promisifyAll(new nedb({ filename: 'plugin-prefs.db', autoload: true })),
    basePrefs = promise.promisifyAll(new nedb({ filename: 'base-prefs.db', autoload: true })),
    users = promise.promisifyAll(new nedb({ filename: 'users.db', autoload: true })),
    options = {
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
    var upgrade = new Upgrade(options);
    return upgrade.run(doc.value);
}).then(function() {
    return systemData.updateAsync({name: 'version'}, {$set: {value: version.full}});
}).then(function() {
    return basePrefs.findOneAsync({name: 'name'});
}).then(function(doc){
    var thisApi;

    options.name = doc.value;

    thisApi = new api(options);
    core_listeners.init(thisApi, users);
    options.api = thisApi;
    admin.init(thisApi, options)

    thisApi.getModules();
})
