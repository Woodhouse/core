var base = require('./base');
var fs = require("fs");

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

    this.getModules = function(){
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

    this.addBaseClasses = function(module, type){
        module.loadApi = base.loadApi;
        module.addMessageSender = base.addMessageSender;
        module.messageRecieved = base.messageRecieved;
        module.listen = base.listen;
        module.sendMessage = base.sendMessage;
        if (type === 'interfaces') {
            module.getPrefs = base.getInterfacePrefs;
        } else if (type === 'plugins') {
            module.getPrefs = base.getPluginPrefs;
        }
    };

    return this;
};
