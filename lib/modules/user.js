var user;

user = function(userData) {
    this.userData = userData;
};


user.prototype.register = function(username, accountName, interface) {
    var self = this;

    return this.userData.findOneAsync(
        {$or: [{username: username}, {['accounts.' + interface]: accountName}]}
    ).then(function(doc) {
        if (doc && doc.username === username) {
            throw new Error('The username ' + username + ' already exists');
        } else if (doc && doc.accounts && doc.accounts[interface] === accountName) {
            throw new Error('This ' + interface + ' account is already registered with another username');
        } else {
            return self.userData.insertAsync({
                username: username,
                accounts:{[interface]: accountName},
                role: 'standard',
                defaultAccount: interface
            });
        }
    })
};

user.prototype.userFromAccount = function(accountName, interface) {
    return this.userData.findOneAsync({['accounts.' + interface]: accountName}).then(function(doc) {
        return doc;
    });
}

module.exports = user
