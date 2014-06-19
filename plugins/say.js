module.exports = function(func){
    var api = func;

    api.listen('say (.+?)', function(from, message){
        api.sendMessage(message[0], 'hangouts', from);
    })
}
