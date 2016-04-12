var say = function(){
    this.name = 'say';
    this.displayname = 'Say';
    this.description = 'Make woodhouse say things back to you';
}


say.prototype.init = function(){
    var self = this;
    this.listen('(say|tell) (:<message>.+?)', 'standard', function(from, interface, params){
        self.sendMessage(from, interface, params[1]);
    })

    this.listen('who steals cars\\?', 'standard', function(from, interface){
        self.sendMessage(from, interface, 'GYPPOS!');
    })

}

module.exports = say;
