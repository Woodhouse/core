module.exports = {
    loadApi: function(api){
        this.api = api;
    },

    getInterfacePrefs: function(key){
        return this.api.getInterfacePrefs(this.name, key);
    },

    getPluginPrefs: function(key){
        console.log('yarr')
        return this.api.getPluginPrefs(this.name, key);
    }

}
