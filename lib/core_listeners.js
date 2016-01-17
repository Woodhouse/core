var ip = require('ip');

module.exports = {
    init: function(api, users){
        api.listen(
            {name: 'modules', displayname: 'Modules'},
            'load modules',
            'admin',
            function(from, interface){
                api.sendMessage('Loading new modules', interface, from);
                api.getModules();
            }
        );

        api.listen(
            {name: 'core', displayname: 'Core'},
            'yes',
            'standard',
            function(from, interface, message){
                var yesNoQuestion = api.yesNo.returnLastYesNoQuestion(from);

                if (yesNoQuestion) {
                    if (typeof yesNoQuestion.yesCallback === 'function') {
                        yesNoQuestion.yesCallback();
                    }

                    api.yesNo.removeLastYesNoQuestion(from);
                }
            }
        );

        api.listen(
            {name: 'core', displayname: 'Core'},
            'no',
            'standard',
            function(from, interface, message){
                var yesNoQuestion = api.yesNo.returnLastYesNoQuestion(from);

                if (yesNoQuestion) {
                    if (typeof yesNoQuestion.noCallback === 'function') {
                        yesNoQuestion.noCallback();
                    }

                    api.yesNo.removeLastYesNoQuestion(from);
                }
            }
        );

        api.listen(
            {name: 'core', displayname: 'Core'},
            'next question',
            'standard',
            function(from, interface, message){
                var yesNoQuestion = api.yesNo.returnLastYesNoQuestion(from);
                if (yesNoQuestion) {
                    api.sendMessage(yesNoQuestion.question, interface, from);
                } else {
                    api.sendMessage('No more questions to ask!', interface, from);
                }
            }
        );

        api.listen(
            {name: 'roles', displayname: 'Roles'},
            'roles (ignore|standard) (:<name>.+?)',
            'trusted',
            function(from, interface, message){
                users.findOneAsync({username: message[1]}).then(function(doc){
                    if (doc) {
                        return users.updateAsync(
                            {username: message[1]},
                            {$set: {role: message[0]}}
                        );
                    } else {
                        throw new Error('The username ' + message[1] + ' does not exist');
                    }
                }).then(function(){
                    api.sendMessage(
                        message[1] + ' set as ' + message[0],
                        interface,
                        from
                    );
                }).catch(function(e) {
                    api.sendMessage(e.message, interface, from);
                });
            }
        );

        api.listen(
            {name: 'roles', displayname: 'Roles'},
            'roles (trusted|admin) (:<name>.+?)',
            'admin',
            function(from, interface, message){
                users.findOneAsync({username: message[1]}).then(function(doc){
                    if (doc) {
                        return users.updateAsync(
                            {username: message[1]},
                            {$set: {role: message[0]}}
                        );
                    } else {
                        throw new Error('The username ' + message[1] + ' does not exist');
                    }
                }).then(function(){
                    api.sendMessage(
                        message[1] + ' set as ' + message[0],
                        interface,
                        from
                    );
                }).catch(function(e) {
                    api.sendMessage(e.message, interface, from);
                });
            }
        );

        api.listen(
            {name: 'roles', displayname: 'Roles'},
            'roles request (:<role>.+?)',
            'ignore',
            function(from, interface, message, user){
                api.user.userFromAccount(user, interface).then(function(doc) {
                    if (!doc) {
                        api.sendMessage(
                            'You need to have a registered user first, use "' + api.name + ' help user" for more information',
                            interface,
                            from
                        );
                        return;
                    }

                    api.permissionRequests[doc.username] = {
                        role: message[0]
                    };
                    api.sendMessage(
                        'You have requested ' + message[0] + ' permissions',
                        interface,
                        from
                    );
                })
            }
        );

        api.listen(
            {name: 'roles', displayname: 'Roles'},
            'roles list requests',
            'trusted',
            function(from, interface, message, user){
                api.users.findOneAsync({
                    $and: [
                        {name: user},
                        {interface: interface}
                    ]
                }).then(function(doc){
                    if(doc){
                        return doc.role;
                    }

                    return api.prefs.interfaces.findOneAsync({name: interface})
                        .then(function(doc) {
                            if (doc.default_permission) {
                                return doc.default_permission;
                            }

                            return api.prefs.base.findOneAsync({name: 'default_permission'})
                                .then(function(permission){
                                    return permission.value;
                                });
                        });
                }).done(function(userRole){
                    var message = '',
                        roleList;
                    if (userRole === 'admin') {
                        roleList = [
                            'admin',
                            'trusted',
                            'standard',
                            'ignore'
                        ];
                    } else {
                        roleList = [
                            'standard',
                            'ignore'
                        ];
                    }

                    for (var key in api.permissionRequests) {
                        if (roleList.indexOf(api.permissionRequests[key].role) > -1) {
                            message += key + ' requests ' + api.permissionRequests[key].role + '\n';
                        }
                    }

                    api.sendMessage(message, interface, from);
                });
            }
        );

        api.listen(
            {name: 'core', displayname: 'Core'},
            'help( (:<optional module>.*?)|)',
            'standard',
            function(from, interface, message, user){
                var exportString = '';

                api.user.userFromAccount(user, interface).then(function(doc){
                    if(doc){
                        exportString += 'Your username: ' + doc.username + '\n';
                        return doc.role;
                    }

                    return api.prefs.interfaces.findOneAsync({name: interface})
                        .then(function(doc) {
                            if (doc.default_permission) {
                                return doc.default_permission;
                            }

                            return api.prefs.base.findOneAsync({name: 'default_permission'})
                                .then(function(permission){
                                    return permission.value;
                                });
                        });
                }).then(function(role){
                    var displayList = {length: 0},
                        listener;

                    exportString += 'Instance IP: ' + ip.address() + '\n' + 'Your role: '+ role + '\n' + 'Commands:\n';
                    for (var key in api.listeners) {
                        if (
                            api.listeners[key].module.name === 'core' ||
                            (message[1] && api.listeners[key].module.name !== message[1])
                        ) {
                            continue;
                        }

                        if (!displayList[api.listeners[key].module.displayname]) {
                            displayList[api.listeners[key].module.displayname] = [];
                            displayList.length++;
                        }

                        listener = api.listeners[key].listener.replace(
                            /(\((:<(.+?)>)*([\(].+?[\)])*(.+?)\))/g,
                            function (group, groupinner, namegroup, name) {
                                if (typeof name !== 'undefined') {
                                    return '<<' + name + '>>'
                                }

                                return group;
                            }
                        );

                        listener = listener.replace(/\\([\[\]\{\}\\\/\|\.\?\+\*])/, '$1');

                        displayList[api.listeners[key].module.displayname]
                            .push('        - Command: ' + listener);

                        displayList[api.listeners[key].module.displayname]
                            .push('        - Role needed: ' + api.listeners[key].role + '\n');
                    }

                    if (message[1] && displayList.length === 0) {
                        return 'There is no module loaded with the name '+ message[1];
                    } else if (displayList.length === 0) {
                        return 'There are no modules loaded'
                    }

                    for (var moduleName in displayList) {
                        if (moduleName === 'length') {
                            continue;
                        }

                        exportString += '    ' + moduleName + '\n';

                        displayList[moduleName].forEach(function(currentValue){
                            exportString += currentValue + '\n';
                        });

                        exportString += '\n';
                    }

                    api.sendMessage(exportString.trim(), interface, from);
                });
            }
        );

        api.listen(
            {name: 'user', displayname: 'User'},
            'user register (:<username>.+?)',
            'standard',
            function(from, interface, message, user) {
                api.user.register(message[0], user, interface).then(function(doc) {
                    api.sendMessage('Successfully registered user ' + message[0], interface, from);
                }).catch(function(e) {
                    api.sendMessage(e.message, interface, from);
                });
            }
        );

        api.listen(
            {name: 'user', displayname: 'User'},
            'user add account (:<username>.+?)',
            'standard',
            function(from, interface, message, user) {
                api.user.addAccount(message[0], user, interface).then(function(code) {
                    api.user.getDefaultAccount(message[0]).then(function(account) {
                        api.sendMessage(
                            'A request to add an account to this user has been made. Your verification code is ' + code,
                            account.interface,
                            account.to
                        );
                        api.sendMessage(
                            'A code has been sent to the default account for this user. ' +
                            'To verify this account use the command "' + api.name + ' user verify <<code>>"',
                            interface,
                            from
                        );
                    })
                }).catch(function(e) {
                    api.sendMessage(e.message, interface, from);
                });
            }
        );

        api.listen(
            {name: 'user', displayname: 'User'},
            'user verify (:<code>.+?)',
            'standard',
            function(from, interface, message, user) {
                api.user.verify(message[0], user, interface).then(function() {
                    api.sendMessage('Account successfully verified', interface, from);
                }).catch(function(e) {
                    api.sendMessage(e.message, interface, from);
                });
            }
        );

        api.listen(
            {name: 'user', displayname: 'User'},
            'user switch default (:<interface>.+?)',
            'standard',
            function(from, interface, message, user) {
                api.user.userFromAccount(user, interface).then(function(doc) {
                    if (!doc) {
                        throw new Error(
                            'You need to have a registered user first, use "' + api.name +
                            ' help user" for more information'
                        );
                    }
                    return api.user.changeDefaultAccount(doc.username, message[0]);
                }).then(function() {
                    api.sendMessage('Successfully changed the default account', interface, from);
                }).catch(function(e) {
                    api.sendMessage(e.message, interface, from);
                });
            }
        );

        api.listen(
            {name: 'user', displayname: 'User'},
            'user change name to (:<new name>.+?)',
            'standard',
            function(from, interface, message, user) {
                var username;
                api.user.userFromAccount(user, interface).then(function(doc) {
                    if (!doc) {
                        throw new Error(
                            'You need to have a registered user first, use "' + api.name +
                            ' help user" for more information'
                        );
                    }

                    username = doc.username;

                    return api.user.rename(doc.username, message[0]);
                }).then(function() {
                    api.sendMessage('Successfully renamed the user ' + username + ' to ' + message[0], interface, from);
                }).catch(function(e) {
                    api.sendMessage(e.message, interface, from);
                });
            }
        );

        api.listen(
            {name: 'user', displayname: 'User'},
            'user remove',
            'standard',
            function(from, interface, message, user) {
                var username;
                api.user.userFromAccount(user, interface).then(function(doc) {
                    if (!doc) {
                        throw new Error(
                            'You need to have a registered user first, use "' + api.name +
                            ' help user" for more information'
                        );
                    }

                    username = doc.username;

                    return api.user.remove(doc.username);
                }).then(function() {
                    api.sendMessage('Successfully removed the user ' + username, interface, from);
                }).catch(function(e) {
                    api.sendMessage(e.message, interface, from);
                });
            }
        );
    }

}
