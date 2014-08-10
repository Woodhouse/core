module.exports = function(api){

    this.name = 'help';

    this.init = function(){
        api.listen('help', function(from, interface, message){
            api.sendMessage('Yes Sir?', interface, from);
        })
    }

    return this;
}
