var fs = require("fs"),
    yesNo = require('./modules/yesno.js'),
    cron = require('./modules/cron.js'),
    promise,
    api;

api = function(deps){
    promise = deps.promise;

    this.name = deps.name;

    this.moduleFiles = {};
    this.modules = {};

    this.prefs = {};
    this.prefs.interfaces = deps.interfacePrefs;
    this.prefs.plugins = deps.pluginPrefs;
    this.prefs.base = deps.basePrefs;

    this.listeners = {};
    this.messageSenders = {};

    this.permissionRequests = {};

    this.users = deps.users;
};

api.prototype.yesNo = new yesNo();

api.prototype.cron = new cron();

api.prototype.listen = function(module, listener, role, command){
    this.listeners[module.name + listener] = {
        module: module,
        listener: listener,
        role: role,
        command: command
    };
}

api.prototype.addListenerAlias = function(module, listener, alias) {
    var registeredListener = this.listeners[module.name + listener],
        listenerParts = listener.match(/\((.+?)\)/g),
        newPartsOrder = [];

    alias.match(/<<([0-9]+)>>/g).forEach(function(value) {
        var partNum = parseInt(value.match(/([0-9]+)/));

        alias = alias.replace(value, listenerParts[partNum]);
        newPartsOrder.push(partNum);
    });

    this.listen(module, alias, registeredListener.role, function(from, interface, params) {
        var newParams = [];

        newPartsOrder.forEach(function(value, i) {
            newParams[value] = params[i];
        });

        registeredListener.command(from, interface, newParams);
    });
}

api.prototype.addMessageSender = function(name, command){
    this.messageSenders[name] = command;
}

api.prototype.messageRecieved = function(interface, from, message, user) {
    var self = this;

    if (typeof user === 'undefined') {
        user = from;
    }

    this.users.findOneAsync({$and: [{name: user}, {interface: interface}]})
        .then(function(doc){
            if(doc){
                return doc.role;
            }

            return self.prefs.interfaces.findOneAsync({name: interface})
                .then(function(doc) {
                    if (doc.default_permission) {
                        return doc.default_permission;
                    }

                    return self.prefs.base.findOneAsync({name: 'default_permission'})
                        .then(function(permission){
                            return permission.value;
                        });
                });
        }).then(function(role){
            message = message.trim();
            for (var item in self.listeners) {
                var match,
                    regex;

                listener = self.listeners[item].listener.replace(/\(:<(.+?)>/g, '(');

                regex = new RegExp("^" + self.name + " "+ listener + "$", 'i')

                match = regex.exec(message);

                if (match && self.checkRole(role, self.listeners[item].role)) {
                    match.shift();
                    self.listeners[item].command(from, interface, match, user);
                }
            }
        });
}

api.prototype.checkRole = function(userRole, actionRole) {
    var roles = ['admin', 'trusted', 'standard', 'ignore'],
        userRoles = roles.slice(roles.indexOf(userRole));

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
    var self = this,
        moduleTypes = ['interfaces', 'plugins'];

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
            self.modules[type][modInstance.name].api = self;
            self.modules[type][modInstance.name].init();
        }

        if (!doc) {
            self.prefs[type].insertAsync({
                name: modInstance.name || '',
                displayname: modInstance.displayname || '',
                description: modInstance.description || '',
                enabled: false,
                default_permission: '',
                canAddNewPrefs: modInstance.canAddNewPrefs || false,
                prefs: modInstance.defaultPrefs || [],
                newPrefsTemplate: modInstance.newPrefsTemplate || []
            });
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

api.prototype.getPrefs = function(type, name, key) {
    var searchObj = {name: name},
        self = this;

    return new promise(function(resolve, reject) {
        if(key){
            searchObj['prefs.name'] = key;
        }

        self.prefs[type].findOneAsync(searchObj).done(function(doc){
            var prefs = {},
                prefKey;

            for (var i = 0, len = doc.prefs.length; i < len; i++) {
                if (doc.prefs[i].group) {
                    prefKey = doc.prefs[i].group + doc.prefs[i].name;
                } else {
                    prefKey = doc.prefs[i].name;
                }
                prefs[prefKey] = doc.prefs[i].value;
            }

            resolve(prefs);
        });
    });
}

api.prototype.addBaseClasses = function(module, type){
    module.addMessageSender = this.addMessageSender.bind(this, module.name);
    module.messageRecieved = this.messageRecieved.bind(this, module.name);
    module.listen = this.listen.bind(this, {name: module.name, displayname: module.displayname});
    module.sendMessage = this.sendMessage.bind(this);
    module.registerCronHandler = this.cron.registerHandler.bind(this.cron, module.name);
    module.addCronJob = this.cron.addJob.bind(this.cron, module.name);
    module.removeCronJob = this.cron.removeJob.bind(this.cron);

    if (type === 'interfaces') {
        module.getPrefs = this.getPrefs.bind(this, 'interfaces', module.name);
    } else if (type === 'plugins') {
        module.getPrefs = this.getPrefs.bind(this, 'plugins', module.name);
    }
}

module.exports = api;
