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

    messageRecieved: function(from, message){
        return this.api.messageRecieved(from, this.name, message);
    },

    listen: function(listener, command){
        return this.api.listen(this.name, listener, command);
    },

    sendMessage: function(message, interface, to){
        return this.api.sendMessage(message, interface, to);
    }

}
