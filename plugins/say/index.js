module.exports = function(api){

    this.name = 'say';

    this.init = function(){
        api.listen('say (.+?)', function(from, interface, params){
            api.sendMessage(params[0], interface, from);
        })

        api.listen('who steals cars\\?', function(from, interface){
            api.sendMessage('GYPPOS!', interface, from);
        })
    }

    return this;
}
