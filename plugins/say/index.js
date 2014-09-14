module.exports = function(){

    this.name = 'say';
    this.displayname = 'Say';
    this.description = 'Make woodhouse say things back to you';

    this.init = function(){
        var self = this;
        this.listen('(say|tell) (.+?)', 'standard', function(from, interface, params){
            self.sendMessage(params[1], interface, from);
        })

        this.listen('who steals cars\\?', 'standard', function(from, interface){
            self.sendMessage('GYPPOS!', interface, from);
        })

    }

    return this;
}
