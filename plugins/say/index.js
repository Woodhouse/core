module.exports = function(){

    this.name = 'say';

    this.init = function(){
        var self = this;
        this.api.listen('say (.+?)', function(from, interface, params){
            self.api.sendMessage(params[0], interface, from);
        })

        this.api.listen('who steals cars\\?', function(from, interface){
            self.api.sendMessage('GYPPOS!', interface, from);
        })
    }

    return this;
}
