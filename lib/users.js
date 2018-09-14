'use strict';

const bluebird = require('bluebird');
const util = require(`./util.js`);

class users {
    constructor(usersData) {
        this.usersData = usersData;
        this.pendingAccounts = {};
        this.roles = Object.freeze(['admin', 'trusted', 'standard', 'ignore']);
    }

    register(username, accountName, interfaceName) {
        return this.usersData.findOneAsync({username}).then((user) => {
            if (user) {
                return bluebird.reject(new Error('The username ' + username + ' already exists'));
            }

            return this.usersData.findOneAsync({['accounts.' + interfaceName]: accountName});
        }).then((user) => {
            if (user && user.accounts && user.accounts[interfaceName] === accountName) {
                return bluebird.reject(new Error('This ' + interfaceName + ' account is already registered with another username'));
            } else {
                return this.usersData.insertAsync({
                    username,
                    accounts:{[interfaceName]: accountName},
                    role: 'standard',
                    defaultAccount: interfaceName
                });
            }
        });
    }

    addAccount(username, accountName, interfaceName) {
        return this.usersData.findOneAsync({['accounts.' + interfaceName]: accountName}).then((user) => {
            if (
                user &&
                user.username !== username &&
                user.accounts &&
                user.accounts[interfaceName] === accountName
            ) {
                return bluebird.reject(new Error('This ' + interfaceName + ' account is already registered with another username'));
            } else if (user && user.username === username) {
                return bluebird.reject(new Error('This ' + interfaceName + ' account is already registered to you'));
            }

            return this.usersData.findOneAsync({username});
        }).then((user) => {
            if (!user) {
                return bluebird.reject(new Error('The username ' + username + ' does not exist'));
            } else if (
                user &&
                user.accounts &&
                user.accounts[interfaceName]
            ) {
                return bluebird.reject(new Error('The username ' + username + ' already has a ' + interfaceName + ' account associated with it'));
            } else {
                const code = util.generateId(4, Object.keys(this.pendingAccounts));

                this.pendingAccounts[code] = {
                    username,
                    accountName,
                    interfaceName
                };

                setTimeout(() => {
                    delete this.pendingAccounts[code];
                }, 60000);

                return code;
            }
        });
    }

    getDefaultAccount(username) {
        return this.usersData.findOneAsync({username}).then((user) => {
            if (!user) {
                return bluebird.reject(new Error('The username ' + username + ' does not exist'));
            }

            return {
                interface: user.defaultAccount,
                account: user.accounts[user.defaultAccount]
            }
        });
    }

    userFromAccount(accountName, interfaceName) {
        return this.usersData.findOneAsync({['accounts.' + interfaceName]: accountName}).then((user) => {
            if (!user) {
                return bluebird.reject(new Error('This ' + interfaceName + ' account is not registered with any username'));
            } else {
                return user;
            }
        });
    }

    verify(code, accountName, interfaceName) {
        if (
            !this.pendingAccounts[code] ||
            this.pendingAccounts[code].accountName !== accountName ||
            this.pendingAccounts[code].interfaceName !== interfaceName
        ) {
            return bluebird.reject(new Error('The code ' + code + ' is either invalid or has timed out.'));
        }

        return this.usersData.updateAsync(
            {username: this.pendingAccounts[code].username},
            {$set: {['accounts.' + this.pendingAccounts[code].interfaceName]: this.pendingAccounts[code].accountName}}
        ).then(() => {
            delete this.pendingAccounts[code];
        });
    }

    changeDefaultAccount(username, changeTo) {
        return this.usersData.findOneAsync({username}).then((user) => {
            if (!user) {
                return bluebird.reject(new Error('The username ' + username + ' does not exist'));
            } else if (!user.accounts[changeTo]) {
                return bluebird.reject(new Error(username + ' does not have a ' + changeTo + ' account associated with it'));
            } else {
                return this.usersData.updateAsync(
                    {username},
                    {$set: {defaultAccount: changeTo}}
                );
            }
        });
    }

    rename(username, newName) {
        return this.usersData.findOneAsync({username}).then((user) => {
            if (!user) {
                return bluebird.reject(new Error('The username ' + username + ' does not exist'));
            }

            return this.usersData.findOneAsync({username: newName});
        }).then((user) => {
            if (user && user.username === newName) {
                return bluebird.reject(new Error('The username ' + newName + ' already exists'));
            } else {
                return this.usersData.updateAsync(
                    {username},
                    {$set: {username: newName}}
                );
            }
        });
    }

    remove(username) {
        return this.usersData.findOneAsync({username}).then((user) => {
            if (!user) {
                return bluebird.reject(new Error('The username ' + username + ' does not exist'));
            } else {
                return this.usersData.removeAsync({username: username});
            }
        });
    }

    setRole(username, role) {
        if (this.roles.indexOf(role) === -1) {
            return bluebird.reject(new Error('"' + role + '" is not a valid role'));
        }

        return this.usersData.findOneAsync({username}).then((user) => {
            if (!user) {
                return bluebird.reject(new Error('The username ' + username + ' does not exist'));
            } else {
                return this.usersData.updateAsync(
                    {username},
                    {$set: {role}}
                );
            }
        });
    }
}

module.exports = users;
