module.exports = function(api, users){
    api.listen({name: 'modules', displayname: 'Modules'},'load modules', 'admin', function(from, interface){
        api.sendMessage('Loading new modules', interface, from);
        api.getModules();
    });

    api.listen({name: 'core', displayname: 'Core'},'yes', 'standard', function(from, interface, message){
        var yesNoQuestion = api.returnLastYesNoQuestion(from);
        if (yesNoQuestion) {
            if (typeof yesNoQuestion.yesCallback === 'function') {
                yesNoQuestion.yesCallback();
            }
            api.removeLastYesNoQuestion(from);
        }
    });

    api.listen({name: 'core', displayname: 'Core'}, 'no', 'standard', function(from, interface, message){
        var yesNoQuestion = api.returnLastYesNoQuestion(from);
        if (yesNoQuestion) {
            if (typeof yesNoQuestion.noCallback === 'function') {
                yesNoQuestion.noCallback();
            }
            api.removeLastYesNoQuestion(from);
        }
    });

    api.listen({name: 'core', displayname: 'Core'}, 'next question', 'standard', function(from, interface, message){
        var yesNoQuestion = api.returnLastYesNoQuestion(from);
        if (yesNoQuestion) {
            api.sendMessage(yesNoQuestion.question, interface, from);
        } else {
            api.sendMessage('No more questions to ask!', interface, from);
        }
    });

    api.listen(
        {name: 'roles', displayname: 'Roles'},
        'roles (ignore|standard) ([^\\s]+?) (.+?)',
        'trusted',
        function(from, interface, message){
            users.findOneAsync({$and: [{name: message[2]}, {interface: message[1]}]}).done(function(doc){
                if (doc) {
                    users.updateAsync({$and: [{name: message[2]}, {interface: message[1]}]}, {$set: {role: message[0]}})
                        .then(function(){
                            api.sendMessage(message[2] + ' set as ' + message[0] + ' on interface ' + message[1], interface, from);
                        })
                } else {
                    users.insertAsync({"name":message[2],"interface":message[1],"role":message[0]})
                        .then(function(){
                            api.sendMessage(message[2] + ' set as ' + message[0] + ' on interface ' + message[1], interface, from);
                        })
                }
            })
        }
    );

    api.listen(
        {name: 'roles', displayname: 'Roles'},
        'roles (trusted|admin) ([^\\s]+?) (.+?)',
        'admin',
        function(from, interface, message){
            users.findOneAsync({$and: [{name: message[2]}, {interface: message[1]}]}).done(function(doc){
                if (doc) {
                    users.updateAsync({$and: [{name: message[2]}, {interface: message[1]}]}, {$set: {role: message[0]}})
                        .done(function(){
                            api.sendMessage(message[2] + ' set as ' + message[0] + ' on interface ' + message[1], interface, from);
                        })
                } else {
                    users.insertAsync({"name":message[2],"interface":message[1],"role":message[0]})
                        .done(function(){
                            api.sendMessage(message[2] + ' set as ' + message[0] + ' on interface ' + message[1], interface, from);
                        })
                }
            })
        }
    );

    api.listen(
        {name: 'roles', displayname: 'Roles'},
        'roles request (.+?)',
        'ignore',
        function(from, interface, message){
            api.permissionRequests[from] = {role: message[0], interface: interface};
            api.sendMessage('You have requested ' + message[0] + ' permissions', interface, from);

        }
    );

    api.listen(
        {name: 'roles', displayname: 'Roles'},
        'roles list requests',
        'trusted',
        function(from, interface, message, user){
            api.users.findOneAsync({$and: [{name: user}, {interface: interface}]}).done(function(doc){
                var userRole = doc.role;
                var message = '';
                var roleList;
                if (userRole === 'admin') {
                    roleList = ['admin', 'trusted', 'standard', 'ignore'];
                } else {
                    roleList = ['standard', 'ignore'];
                }

                for (var key in api.permissionRequests) {
                    if (roleList.indexOf(api.permissionRequests[key].role) > -1) {
                        message += key + ' on interface ' + api.permissionRequests[key].interface + ' requests ' + api.permissionRequests[key].role + '\n';
                    }
                }

                api.sendMessage(message, interface, from);
            });
        }
    );

    api.listen(
        {name: 'core', displayname: 'Core'},
        'help( (.*?)|)',
        'standard',
        function(from, interface, message, user){
            api.returnHelp(user, interface, message[1]).then(function(helpMessage){
                api.sendMessage(helpMessage, interface, from);
            })
        }
    );
}
