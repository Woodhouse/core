'use strict';

const bluebird = require('bluebird');

class dispatcher {
    constructor(users, moduleData, systemPrefs) {
        this.users = users;
        this.moduleData = moduleData;
        this.systemPrefs = systemPrefs;
        this.listeners = {};
        this.messageSenders = {};
        this.messageQueue = {};
    }

    addMessageSender(moduleName, callback) {
        this.messageSenders[moduleName] = callback;
    }

    messageRecieved(interfaceName, from, message, interfaceUser) {
        let name;
        message = message.trim();

        if (typeof interfaceUser === 'undefined') {
            interfaceUser = from;
        }

        return this.systemPrefs.get('name').then((instanceName) => {
            name = instanceName;

            return this.users.userFromAccount(interfaceUser, interfaceName);
        }).then((user) => {
            return user.role;
        }).catch(() => {
            return this.moduleData.get('interface', interfaceName, 'default_permission');
        }).then((role) => {
            if (role && role.length  > 0) {
                return role;
            }

            return this.systemPrefs.get('default_permission');
        }).then((role) => {
            const listenerPromises = [];
            let matched = false;

            for (let listenerObjectKey in this.listeners) {
                let listener = this.listeners[listenerObjectKey].listener.replace(/\(:<(.+?)>/g, '(');

                let pattern = new RegExp("^" + name + " "+ listener + "$", 'i');

                let match = pattern.exec(message);

                matched |= !!match;

                if (match && this.checkRole(role, this.listeners[listenerObjectKey].role)) {
                    match.shift();

                    const result = this.listeners[listenerObjectKey].command(from, interfaceName, match, interfaceUser);

                    if (typeof result === 'object' && typeof result.then === 'function') {
                        listenerPromises.push(result);
                    } else if (typeof result === 'string') {
                        listenerPromises.push(bluebird.resolve(result));
                    }
                } else if (match) {
                    listenerPromises.push(bluebird.resolve(`Matched listener '${this.listeners[listenerObjectKey].listener}' but you don't have the correct permission level. Listener requires '${this.listeners[listenerObjectKey].role}' and you have '${role}'`));
                }
            }

            if (listenerPromises.length > 0) {
                return bluebird.all(listenerPromises).then((results) => {
                    results = results.join(`\n`);
                    this.sendMessage(from, interfaceName, results);
                    return results;
                });
            }

            if (!matched) {
                let noneMatched = `No command matched '${message}'`;
                this.sendMessage(from, interfaceName, noneMatched);
                return bluebird.resolve(noneMatched);
            }

            return bluebird.resolve();
        });
    }

    listen(module, listener, roleNeeded, command, isAlias = false) {
        let listenerKey = module.name + listener.replace(
            /(\((:<(.+?)>)*([\(].+?[\)])*(.+?)\))/g,
            (group, groupinner, namegroup, name) => {
                if (typeof name !== 'undefined') {
                    return '<<' + name + '>>'
                }

                return group;
            }
        );

        this.listeners[listenerKey] = {
            module,
            listener,
            role: roleNeeded,
            command,
            isAlias
        }
    }

    sendMessage(to, interfaceName, message, debounce = true) {
        if (this.messageSenders[interfaceName]) {
            if (debounce) {
                if (typeof this.messageQueue[`${interfaceName}${to}`] === `undefined`) {
                    this.messageQueue[`${interfaceName}${to}`] = {
                        messages:[]
                    }
                }

                this.messageQueue[`${interfaceName}${to}`].messages.push(message);

                if (typeof this.messageQueue[`${interfaceName}${to}`].timeout === `undefined`) {
                    this.messageQueue[`${interfaceName}${to}`].timeout = setTimeout(() => {
                        let groupedMessage = this.messageQueue[`${interfaceName}${to}`].messages.join(`\n`);
                        this.messageSenders[interfaceName](to, groupedMessage);
                        delete this.messageQueue[`${interfaceName}${to}`];
                    }, 500)
                }
            } else {
                this.messageSenders[interfaceName](to, message);
            }
        }
    }

    loadListenerAliases(module) {
        return this.moduleData.get('plugin', module.name, 'listeneraliases').then((aliases) => {
            for (let aliasObject of aliases) {
                let registeredListener = this.listeners[module.name + aliasObject.listener];

                if (registeredListener) {
                    let listenerParts = registeredListener.listener.match(/\((.+?)\)/g);
                    let newPartsOrder = [];
                    let aliasParts = aliasObject.alias.match(/<<(.+?)>>/g);

                    listenerParts.forEach(function(value, i) {
                        let partName = value.match(/:<(.+?)>/);

                        if (!partName) {
                            return;
                        }

                        partName = partName[1];

                        let aliasPartNum = aliasParts.indexOf('<<' + partName + '>>');

                        newPartsOrder[aliasPartNum] = i;

                        aliasObject.alias = aliasObject.alias.replace(aliasParts[aliasPartNum], value);
                    });

                    this.listen(module, aliasObject.alias, registeredListener.role, function(from, interfaceName, params, interfaceUser) {
                        let newParams = [];

                        newPartsOrder.forEach(function(value, i) {
                            newParams[value] = params[i];
                        });

                        return registeredListener.command(from, interfaceName, newParams);
                    }, true);
                }
            }
        }).catch(() => {
            // quietly suppress the fact that we don't have listeneraliases for this module
        })
    }

    checkRole(userRole, actionRole) {
        let roles = ['admin', 'trusted', 'standard', 'ignore'];
        let userRoles = roles.slice(roles.indexOf(userRole));

        if (userRoles.indexOf(actionRole) > -1) {
            return true;
        } else {
            return false;
        }
    }
}

module.exports = dispatcher;
