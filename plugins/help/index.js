module.exports = function(api){

    api.listen('help', function(from, interface, message){
        api.sendMessage('Yes Sir?', interface, from);
    })
}
