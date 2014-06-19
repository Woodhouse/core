module.exports = function(api){

    api.listen('help', function(from, message){
        api.sendMessage('Yes Sir?', 'hangouts', from);
    })
}
