var promise = require('bluebird');
var base = require('./base');
var interfacePrefs,
    pluginPrefs,
    promise;

module.exports = function(deps){
    interfacePrefs = deps.interfacePrefs;
    pluginPrefs = deps.pluginPrefs;
    promise = deps.promise;
    listeners = [];
    messageSenders = {};
    yesNoQuestions = [];
    name = 'woodhouse';
    interfaces = {};
    plugins = {};

    this.listen = function(listener, command){
        this.listeners.push({listener: listener, command: command});
    };

    this.messageRecieved = function(from, interface, message) {
        for (var i = 0, len = this.listeners.length; i < len; i++) {
            var regex = new RegExp("^" + this.name + " "+ this.listeners[i].listener + "$", 'i'),
                match = regex.exec(message);
            if (match) {
                match.shift();
                this.listeners[i].command(from, interface, match);
            }
        }
    };

    this.addMessageSender = function(name, command){
        this.messageSenders[name] = command;
    }

    this.sendMessage = function(message, interface, to){
        if (interface) {
            this.messageSenders[interface](message, to);
        } else {
            for (var interface in this.messageSenders) {
                this.messageSenders[interface](message, to);
            }
        }
    };

    this.addYesNoQuestion = function(question, yesCallback, noCallback){
        this.yesNoQuestions.push({question: question, yesCallback: yesCallback, noCallback: noCallback});
    };

    this.removeLastYesNoQuestion = function(){
        this.yesNoQuestions.pop();
    };

    this.loadInterface = function(file) {
        var self = this,
            module = require("../interfaces/" + file);

        this.interfaces[file] = new module();
        this.addBaseClasses(this.interfaces[file], 'interface');
        this.interfaces[file].loadApi(this);
        interfacePrefs.findOneAsync({name: this.interfaces[file].name}).done(function(doc){
            if (doc && doc.enabled === true) {
                self.interfaces[file].init();
            }

            if (!doc) {
                var prefs = {
                    name: self.interfaces[file].name,
                    enabled:  false,
                    prefs: self.interfaces[file].defaultPrefs || {}
                }
                interfacePrefs.insertAsync(prefs);
            }
        });
    };

    this.loadPlugin = function(file) {
        var self = this,
            module = require("../plugins/" + file);

        this.plugins[file] = new module();
        this.addBaseClasses(this.plugins[file], 'plugin');
        this.plugins[file].loadApi(this);
        pluginPrefs.findOneAsync({name: this.plugins[file].name}).done(function(doc){
            if (doc && doc.enabled === true) {
                self.plugins[file].init();
            }

            if (!doc) {
                var prefs = self.plugins[file].defaultPrefs || {};
                prefs.name = self.plugins[file].name;
                prefs.enabled =  false;
                pluginPrefs.insertAsync(prefs);
            }
        });
    };

    this.getInterfacePrefs = function(name, key){
        var searchObj = {name: name};
        return new promise(function(resolve, reject) {
            if(key){
                searchObj['prefs.name'] = key;
            }
            interfacePrefs.findOneAsync({name: name}).done(function(doc){
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
        if (type === 'interface') {
            module.getPrefs = base.getInterfacePrefs;
        } else if (type === 'plugin') {
            module.getPrefs = base.getPluginPrefs;
        }
    };

    return this;
};
