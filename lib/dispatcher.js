'use strict';

class dispatcher {
    constructor(users, moduleData, systemPrefs) {
        this.users = users;
        this.moduleData = moduleData;
        this.systemPrefs = systemPrefs;
        this.listeners = {};
        this.messageSenders = {};
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
            if (user && user.role) {
                return user.role;
            }

            return this.moduleData.get('interface', interfaceName, 'default_permission');
        }).then((role) => {
            if (role && role.length  > 0) {
                return role;
            }

            return this.systemPrefs.get('default_permission');
        }).then((role) => {
            for (let listenerObjectKey in this.listeners) {
                let listener = this.listeners[listenerObjectKey].listener.replace(/\(:<(.+?)>/g, '(');

                let pattern = new RegExp("^" + name + " "+ listener + "$", 'i');

                let match = pattern.exec(message);

                if (match && this.checkRole(role, this.listeners[listenerObjectKey].role)) {
                    match.shift()
                    this.listeners[listenerObjectKey].command(from, interfaceName, match, interfaceUser);
                }
            }
        });
    }

    listen(module, listener, roleNeeded, command, isAlias) {
        if (typeof isAlias === 'undefined') {
            isAlias = false;
        }

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

    sendMessage(to, interfaceName, message) {
        if (this.messageSenders[interfaceName]) {
            this.messageSenders[interfaceName](to, message);
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

                        registeredListener.command(from, interfaceName, newParams);
                    }, true);
                }
            }
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
