var say = function(){
    this.name = 'say';
    this.displayname = 'Say';
    this.description = 'Make woodhouse say things back to you';
}


say.prototype.init = function(){
    var self = this;
    this.listen('(say|tell) (:<message>.+?)', 'standard', function(from, interface, params){
        self.sendMessage(params[1], interface, from);
    })

    this.listen('who steals cars\\?', 'standard', function(from, interface){
        self.sendMessage('GYPPOS!', interface, from);
    })

}

module.exports = say;
