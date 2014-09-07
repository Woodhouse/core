module.exports = function(api, users){
    api.listen('loadmodules','load modules', 'admin', function(from, interface){
        api.sendMessage('Loading new modules', interface, from);
        api.getModules();
    });

    api.listen('yesno','yes', 'standard', function(from, interface, message){
        var yesNoQuestion = api.returnLastYesNoQuestion();
        if (yesNoQuestion) {
            if (typeof yesNoQuestion.yesCallback === 'function') {
                yesNoQuestion.yesCallback();
            }
            api.removeLastYesNoQuestion();
        }
    });

    api.listen('yesno', 'no', 'standard', function(from, interface, message){
        var yesNoQuestion = api.returnLastYesNoQuestion();
        if (yesNoQuestion) {
            if (typeof yesNoQuestion.noCallback === 'function') {
                yesNoQuestion.noCallback();
            }
            api.removeLastYesNoQuestion();
        }
    });

    api.listen('yesno', 'next question', 'standard', function(from, interface, message){
        var yesNoQuestion = api.returnLastYesNoQuestion();
        if (yesNoQuestion) {
            api.sendMessage(yesNoQuestion.question, interface, from);
        } else {
            api.sendMessage('No more questions to ask!', interface, from);
        }
    });

    api.listen('roles', 'roles (ignore|standard) ([^\\s]+?) (.+?)', 'trusted', function(from, interface, message){
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
    });

    api.listen('roles', 'roles (trusted|admin) ([^\\s]+?) (.+?)', 'admin', function(from, interface, message){
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
    });
}
