var module_base = require('./module_base.js');
var fs = require("fs");
var cron = require('cron').CronJob;
var yesNo = require('./modules/yesno.js');
var promise;

var api = function(deps){
    promise = deps.promise;

    this.prefs = {};
    this.prefs.interfaces = deps.interfacePrefs;
    this.prefs.plugins = deps.pluginPrefs;
    this.prefs.base = deps.basePrefs;
    this.users = deps.users;
    this.listeners = {};
    this.messageSenders = {};
    this.name = deps.name;
    this.modules = {};
    this.moduleFiles = {};
    this.permissionRequests = {};
    this.cron = [];
};

api.prototype.yesNo = new yesNo();

api.prototype.listen = function(module, listener, role, command){
    this.listeners[module.name+listener] = {module: module, listener: listener, role: role, command: command};
}

api.prototype.addMessageSender = function(name, command){
    this.messageSenders[name] = command;
}

api.prototype.messageRecieved = function(from, interface, message, user) {
    var self = this;
    if (typeof user === 'undefined') {
        user = from;
    }
    this.prefs.base.findOneAsync({name: 'default_permission'}).done(function(permission){
        self.users.findOneAsync({$and: [{name: user}, {interface: interface}]}).done(function(doc){
            var role = permission.value,
                listener;

            if(doc){
                role = doc.role;
            }

            message = message.trim();
            for (var item in self.listeners) {
                listener = self.listeners[item].listener.replace(/\(:<(.+?)>/g, '(');
                var regex = new RegExp("^" + self.name + " "+ listener + "$", 'i'),
                    match = regex.exec(message);

                if (match && self.checkRole(role, self.listeners[item].role)) {
                    match.shift();
                    self.listeners[item].command(from, interface, match, user);
                }
            }
        });
    });
}

api.prototype.checkRole = function(userRole, actionRole) {
    var roles = ['admin', 'trusted', 'standard', 'ignore'];
    var userRoles = roles.slice(roles.indexOf(userRole));

    if (userRoles.indexOf(actionRole) > -1) {
        return true;
    } else {
        return false;
    }
}

api.prototype.sendMessage = function(message, interface, to){
    if (this.messageSenders[interface]) {
        this.messageSenders[interface](message, to);
    }
};

api.prototype.getModules = function(){
    var self = this;
    var moduleTypes = ['interfaces', 'plugins'];
    for (var i = 0, len = moduleTypes.length; i < len; i++) {
        fs.readdirSync("./" + moduleTypes[i]).forEach(function(file) {
            if (fs.statSync("./" + moduleTypes[i] + "/" + file).isDirectory()) {
                self.loadModule(file, moduleTypes[i]);
            }
        });
    }
}

api.prototype.loadModule = function(file, type) {
    var self = this,
        module = require("../" + type + "/" + file),
        modInstance = new module();

    if (!this.modules[type]) {
        this.modules[type] = {};
    }
    if (!this.moduleFiles[type]) {
        this.moduleFiles[type] = {};
    }

    if (this.modules[type][modInstance.name]) {
        delete modInstance;
        return;
    }

    this.moduleFiles[type][modInstance.name] = file;
    this.prefs[type].findOneAsync({name: modInstance.name}).done(function(doc){
        if (doc && doc.enabled === true) {
            self.modules[type][modInstance.name] = modInstance;
            self.addBaseClasses(self.modules[type][modInstance.name], type);
            self.modules[type][modInstance.name].loadApi(self);
            self.modules[type][modInstance.name].init();
        }

        if (!doc) {
            var prefs = {
                name: modInstance.name || '',
                displayname: modInstance.displayname || '',
                description: modInstance.description || '',
                enabled: false,
                canAddNewPrefs: modInstance.canAddNewPrefs || false,
                prefs: modInstance.defaultPrefs || [],
                newPrefsTemplate: modInstance.newPrefsTemplate || []
            }
            self.prefs[type].insertAsync(prefs);
        }
    });
};

api.prototype.unloadModule = function(name, type) {
    if (typeof this.modules[type][name] !== 'undefined') {
        if (typeof this.modules[type][name].exit === 'function'){
            this.modules[type][name].exit();
        }

        delete this.modules[type][name];

        if (this.messageSenders[name]){
            delete this.messageSenders[name];
        }

        for (var listener in this.listeners) {
            if (this.listeners[listener].module.name === name) {
                delete this.listeners[listener];
            }
        }
    }
};

api.prototype.reloadModule = function(name, type) {
    var fileName = this.moduleFiles[type][name];

    this.unloadModule(name, type);
    this.loadModule(fileName, type);
};

api.prototype.getInterfacePrefs = function(name, key){
    return this.getPrefs('interfaces', name, key);
};

api.prototype.getPluginPrefs = function(name, key){
    return this.getPrefs('plugins', name, key);
}

api.prototype.getPrefs = function(type, name, key) {
    var searchObj = {name: name},
        self = this;
    return new promise(function(resolve, reject) {
        if(key){
            searchObj['prefs.name'] = key;
        }
        self.prefs[type].findOneAsync(searchObj).done(function(doc){
            var prefs = {};
            for (var i = 0, len = doc.prefs.length; i < len; i++) {
                var key = doc.prefs[i].group ? doc.prefs[i].group+doc.prefs[i].name : doc.prefs[i].name;
                prefs[key] = doc.prefs[i].value;
            }
            resolve(prefs);
        });
    });
}

api.prototype.addBaseClasses = function(module, type){
    module.loadApi = module_base.loadApi;
    module.addMessageSender = module_base.addMessageSender;
    module.messageRecieved = module_base.messageRecieved;
    module.listen = module_base.listen;
    module.sendMessage = module_base.sendMessage;
    if (type === 'interfaces') {
        module.getPrefs = module_base.getInterfacePrefs;
    } else if (type === 'plugins') {
        module.getPrefs = module_base.getPluginPrefs;
    }
}

api.prototype.addCronJob = function(crontime, callback) {
    var self = this;
    this.cron.push(new cron(crontime, callback, null, true));

    return this.cron.length - 1;
}

api.prototype.stopCronJob = function(id){
    if (this.cron[id]) {
        this.cron[id].stop();
    }
}

module.exports = api;
