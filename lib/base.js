module.exports = {
    loadApi: function(api){
        this.api = api;
    },

    getInterfacePrefs: function(key){
        return this.api.getInterfacePrefs(this.name, key);
    },

    getPluginPrefs: function(key){
        return this.api.getPluginPrefs(this.name, key);
    },

    addMessageSender: function(command){
        return this.api.addMessageSender(this.name, command);
    },

    messageRecieved: function(from, message, user){
        return this.api.messageRecieved(from, this.name, message, user);
    },

    listen: function(listener, role, command){
        return this.api.listen(this.name, listener, role, command);
    },

    sendMessage: function(message, interface, to){
        return this.api.sendMessage(message, interface, to);
    }

}
