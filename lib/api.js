var base = require('./base');

module.exports = function(deps){
    var promise;

    this.prefs = {};
    this.prefs.interfaces = deps.interfacePrefs;
    this.prefs.plugins = deps.pluginPrefs;
    promise = deps.promise;
    this.listeners = [];
    this.messageSenders = {};
    this.yesNoQuestions = [];
    this.name = 'woodhouse';
    this.modules = {};

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

    this.loadModule = function(file, type) {
        var self = this,
            module = require("../" + type + "/" + file);

        if (!this.modules[type]) {
            this.modules[type] = {};
        }

        this.modules[type][file] = new module();
        this.addBaseClasses(this.modules[type][file], 'interface');
        this.modules[type][file].loadApi(this);
        this.prefs[type].findOneAsync({name: this.modules[type][file].name}).done(function(doc){
            if (doc && doc.enabled === true) {
                self.modules[type][file].init();
            }

            if (!doc) {
                var prefs = {
                    name: self.modules[type][file].name,
                    enabled:  false,
                    prefs: self.modules[type][file].defaultPrefs || []
                }
                interfacePrefs.insertAsync(prefs);
            }
        });
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
        if (type === 'interface') {
            module.getPrefs = base.getInterfacePrefs;
        } else if (type === 'plugin') {
            module.getPrefs = base.getPluginPrefs;
        }
    };

    return this;
};
