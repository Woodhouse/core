var addDefaultInterfacePrefs = function(deps){
    this.deps = deps;
};

addDefaultInterfacePrefs.prototype = {
    up: function() {
        return this.deps.interfacePrefs.insertAsync({
            'name':'shell',
            'displayname':'Shell',
            'description':'Issue commands through the command line',
            'enabled':true,
            'prefs':[]
        });
    }
};

module.exports = addDefaultInterfacePrefs;
