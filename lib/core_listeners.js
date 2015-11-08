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
            'roles (ignore|standard) (:<interface>[^\\s]+?) (:<name>.+?)',
            'trusted',
            function(from, interface, message){
                users.findOneAsync({
                    $and: [
                        {name: message[2]},
                        {interface: message[1]}
                    ]
                }).then(function(doc){
                    if (doc) {
                        return users.updateAsync(
                            {$and: [
                                {name: message[2]},
                                {interface: message[1]}
                            ]},
                            {$set: {role: message[0]}}
                        );
                    } else {
                        return users.insertAsync({
                            name: message[2],
                            interface: message[1],
                            role: message[0]
                        });
                    }
                }).then(function(){
                    api.sendMessage(
                        message[2] + ' set as ' + message[0] + ' on interface ' + message[1],
                        interface,
                        from
                    );
                });
            }
        );

        api.listen(
            {name: 'roles', displayname: 'Roles'},
            'roles (trusted|admin) (:<interface>[^\\s]+?) (:<name>.+?)',
            'admin',
            function(from, interface, message){
                users.findOneAsync({
                    $and: [
                        {name: message[2]},
                        {interface: message[1]}
                    ]
                }).then(function(doc){
                    if (doc) {
                        return users.updateAsync(
                            {$and: [
                                {name: message[2]},
                                {interface: message[1]}
                            ]},
                            {$set: {role: message[0]}}
                        );
                    } else {
                        return users.insertAsync({
                            name: message[2],
                            interface: message[1],
                            role: message[0]
                        });
                    }
                }).then(function(){
                    api.sendMessage(
                        message[2] + ' set as ' + message[0] + ' on interface ' + message[1],
                        interface,
                        from
                    );
                })
            }
        );

        api.listen(
            {name: 'roles', displayname: 'Roles'},
            'roles request (:<role>.+?)',
            'ignore',
            function(from, interface, message){
                api.permissionRequests[from] = {
                    role: message[0],
                    interface: interface
                };
                api.sendMessage(
                    'You have requested ' + message[0] + ' permissions',
                    interface,
                    from
                );
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
                            message += key + ' on interface ' +
                                api.permissionRequests[key].interface + ' requests ' +
                                api.permissionRequests[key].role + '\n';
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
                }).then(function(role){
                    var displayList = {length: 0},
                        exportString = 'Instance IP: ' + ip.address() + '\n' + 'Your role: '+ role + '\n' + 'Commands:\n',
                        listener;

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
    }

}
