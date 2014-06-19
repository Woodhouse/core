module.exports = function(api){

    api.listen('say (.+?)', function(from, message){
        api.sendMessage(message[0], 'hangouts', from);
    })

    api.listen('who steals cars\?', function(from, message){
        api.sendMessage('GYPPOS!', 'hangouts', from);
    })
}
