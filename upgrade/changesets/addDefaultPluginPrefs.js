var addDefaultPluginPrefs = function(deps){
    this.deps = deps;
};

addDefaultPluginPrefs.prototype = {
    up: function() {
        return this.deps.pluginPrefs.insertAsync({
            'name':'say',
            'displayname':'Say',
            'description':'Make woodhouse say things back to you',
            'enabled':true,
            'prefs':[]
        });
    }
};

module.exports = addDefaultPluginPrefs;
