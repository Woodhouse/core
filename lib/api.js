var base = require('./base');

module.exports = function(deps){
    var promise;

    this.prefs = {};
    this.prefs.interfaces = deps.interfacePrefs;
    this.prefs.plugins = deps.pluginPrefs;
    promise = deps.promise;
    this.listeners = {};
    this.messageSenders = {};
    this.yesNoQuestions = [];
    this.name = deps.name;
    this.modules = {};
    this.moduleFiles = {};

    this.listen = function(module, listener, command){
        this.listeners[module+listener] = {module: module, listener: listener, command: command};
    };

    this.messageRecieved = function(from, interface, message) {
        for (var item in this.listeners) {
            var regex = new RegExp("^" + this.name + " "+ this.listeners[item].listener + "$", 'i'),
                match = regex.exec(message);
            if (match) {
                match.shift();
                this.listeners[item].command(from, interface, match);
            }
        }
    };

    this.addMessageSender = function(name, command){
        this.messageSenders[name] = command;
    }

    this.sendMessage = function(message, interface, to){
        if (this.messageSenders[interface]) {
            this.messageSenders[interface](message, to);
        }
    };

    this.addYesNoQuestion = function(question, yesCallback, noCallback){
        this.yesNoQuestions.push({question: question, yesCallback: yesCallback, noCallback: noCallback});
    };

    this.removeLastYesNoQuestion = function(){
        this.yesNoQuestions.pop();
    };

    this.loadModule = function(file, type) {
        var self = this,
            module = require("../" + type + "/" + file),
            modInstance = new module();

        if (!this.modules[type]) {
            this.modules[type] = {};
        }
        if (!this.moduleFiles[type]) {
            this.moduleFiles[type] = {};
        }

        this.moduleFiles[type][modInstance.name] = file;
        this.modules[type][modInstance.name] = modInstance;
        this.addBaseClasses(this.modules[type][modInstance.name], 'interface');
        this.modules[type][modInstance.name].loadApi(this);
        this.prefs[type].findOneAsync({name: this.modules[type][modInstance.name].name}).done(function(doc){
            if (doc && doc.enabled === true) {
                self.modules[type][modInstance.name].init();
            }

            if (!doc) {
                var prefs = {
                    name: self.modules[type][modInstance.name].name,
                    displayname: self.modules[type][modInstance.name].displayname,
                    description: self.modules[type][modInstance.name].description,
                    enabled:  false,
                    prefs: self.modules[type][modInstance.name].defaultPrefs || []
                }
                this.prefs[type].insertAsync(prefs);
            }
        });
    };

    this.unloadModule = function(name, type) {
        if (typeof this.modules[type][name] !== 'undefined') {
            if (typeof this.modules[type][name].exit === 'function'){
                this.modules[type][name].exit();
            }

            delete this.modules[type][name];

            if (this.messageSenders[name]){
                delete this.messageSenders[name];
            }

            for (var listener in this.listeners) {
                if (this.listeners[listener].module === name) {
                    delete this.listeners[listener];
                }
            }
        }
    };

    this.reloadModule = function(name, type) {
        var fileName = this.moduleFiles[type][name];

        this.unloadModule(name, type);
        this.loadModule(fileName, type);
    };

    this.getInterfacePrefs = function(name, key){
        return this.getPrefs('interfaces', name, key);
    };

    this.getPluginPrefs = function(name, key){
        return this.getPrefs('plugins', name, key);
    }

    this.getPrefs = function(type, name, key) {
        var searchObj = {name: name},
            self = this;
        return new promise(function(resolve, reject) {
            if(key){
                searchObj['prefs.name'] = key;
            }
            self.prefs[type].findOneAsync({name: name}).done(function(doc){
                var prefs = {};
                for (var i = 0, len = doc.prefs.length; i < len; i++) {
                    prefs[doc.prefs[i].name] = doc.prefs[i].value;
                }
                resolve(prefs);
            });
        });
    }

    this.addBaseClasses = function(module, type){
        module.loadApi = base.loadApi;
        module.addMessageSender = base.addMessageSender;
        module.messageRecieved = base.messageRecieved;
        module.listen = base.listen;
        module.sendMessage = base.sendMessage;
        if (type === 'interface') {
            module.getPrefs = base.getInterfacePrefs;
        } else if (type === 'plugin') {
            module.getPrefs = base.getPluginPrefs;
        }
    };

    return this;
};
