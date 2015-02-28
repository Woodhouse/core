var promise = require('bluebird');
var nedb = require('nedb');
var interfacePrefs = new nedb({ filename: 'interface-prefs.db', autoload: true });
var pluginPrefs = new nedb({ filename: 'plugin-prefs.db', autoload: true });
var basePrefs = new nedb({ filename: 'base-prefs.db', autoload: true });
var users = new nedb({ filename: 'users.db', autoload: true });
var api = require('./lib/api');
promise.promisifyAll(interfacePrefs);
promise.promisifyAll(pluginPrefs);
promise.promisifyAll(basePrefs);
promise.promisifyAll(users);

basePrefs.findOneAsync({name: 'name'}).done(function(doc){
   var thisApi = new api({
        promise: promise,
        interfacePrefs: interfacePrefs,
        pluginPrefs: pluginPrefs,
        basePrefs: basePrefs,
        users: users,
        name: doc.value
    });

    require('./lib/core_listeners.js')(thisApi, users);

    require('./admin/')({
        promise: promise,
        interfacePrefs: interfacePrefs,
        pluginPrefs: pluginPrefs,
        basePrefs: basePrefs,
        users: users,
        api: thisApi
    })

    thisApi.getModules();
});
