var help = function(){

    this.name = 'help';
    this.displayname = 'Help';

}

help.prototype.init = function(){
    var self = this;
    this.listen('help', 'standard', function(from, interface, message){
        self.sendMessage('Yes Sir?', interface, from);
    })
}

module.exports = help;
