var Promise = require('bluebird'),
    crypto = require('crypto'),
    user = function(userData) {
        this.userData = userData;
        this.pendingAccounts = {}
    },
    createPendingAccount = function() {
        var code = crypto.randomBytes(4).toString('hex').slice(0,4);

        if (this.pendingAccounts[code]) {
            return createPendingAccount.call(this);
        } else {
            this.pendingAccounts[code] = {};
            return code;
        }
    };


user.prototype.register = function(username, accountName, interface) {
    return this.userData.findOneAsync(
        {$or: [{username: username}, {['accounts.' + interface]: accountName}]}
    ).then(function(doc) {
        if (doc && doc.username === username) {
            throw new Error('The username ' + username + ' already exists');
        } else if (doc && doc.accounts && doc.accounts[interface] === accountName) {
            throw new Error('This ' + interface + ' account is already registered with another username');
        } else {
            return this.userData.insertAsync({
                username: username,
                accounts:{[interface]: accountName},
                role: 'standard',
                defaultAccount: interface
            });
        }
    }.bind(this))
};

user.prototype.userFromAccount = function(accountName, interface) {
    return this.userData.findOneAsync({['accounts.' + interface]: accountName}).then(function(doc) {
        return doc;
    });
};

user.prototype.addAccount = function(username, accountName, interface) {
    return this.userData.findOneAsync(
        {$or: [{username: username}, {['accounts.' + interface]: accountName}]}
    ).then(function(doc) {
        var code;
        if (doc && doc.username === username && !doc.accounts[interface]) {
            code = createPendingAccount.call(this);

            this.pendingAccounts[code].username = username;
            this.pendingAccounts[code].accountName = accountName;
            this.pendingAccounts[code].interface = interface;

            setTimeout(function() {
                delete this.pendingAccounts[code];
            }.bind(this), 60000);

            return code;
        } else if (doc && doc.accounts && doc.accounts[interface] === accountName) {
            throw new Error('This ' + interface + ' account is already registered with another username');
        } else {
            throw new Error('The username ' + username + ' does not exist');
        }
    }.bind(this));
};

user.prototype.getDefaultAccount = function(username) {
    return this.userData.findOneAsync({username: username}).then(function(doc) {
        if (!doc) {
            throw new Error('The username ' + username + ' does not exist');
        }

        return {
            interface: doc.defaultAccount,
            to: doc.accounts[doc.defaultAccount]
        }
    });
};

user.prototype.verify = function(code, accountName, interface) {
    return new Promise(function (resolve, reject) {
        if (
            !this.pendingAccounts[code] ||
            this.pendingAccounts[code].accountName !== accountName ||
            this.pendingAccounts[code].interface !== interface
        ) {
            throw new Error('The code ' + code + ' is either invalid or has timed out.');
        }

        resolve(this.userData.updateAsync(
            {username: this.pendingAccounts[code].username},
            {$set: {['accounts.' + this.pendingAccounts[code].interface]: this.pendingAccounts[code].accountName}}
        ));
    }.bind(this))
};

user.prototype.changeDefaultAccount = function(username, changeTo) {
    return this.userData.findOneAsync({username: username}).then(function(doc) {
        if (!doc) {
            throw new Error('The username ' + username + ' does not exist');
        } else if (!doc.accounts[changeTo]) {
            throw new Error(username + 'does not have a ' + changeTo + 'account associated with it');
        } else {
            return this.userData.updateAsync(
                {username: username},
                {$set: {defaultAccount: changeTo}}
            );
        }
    }.bind(this))
};

user.prototype.rename = function(username, newName) {
    return this.userData.findOneAsync({username: newName}).then(function(doc) {
        if (doc) {
            throw new Error('The username ' + username + ' already exists');
        } else {
            return this.userData.updateAsync(
                {username: username},
                {$set: {username: newName}}
            );
        }
    }.bind(this));
};


user.prototype.remove = function(username) {
    return this.userData.removeAsync({username: username});
};

module.exports = user
