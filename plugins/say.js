module.exports = function(api){

    api.listen('say (.+?)', function(from, interface, message){
        api.sendMessage(message[0], interface, from);
    })

    api.listen('who steals cars\\?', function(from, interface, message){
        api.sendMessage('GYPPOS!', interface, from);
    })
}
