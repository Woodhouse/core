module.exports = function(func){
    var api = func;

    api.listen('help', function(from, message){
        api.sendMessage('Yes Sir?', 'hangouts', from);
    })
}
