module.exports = function(){

    this.name = 'help';
    this.displayname = 'Help';

    this.init = function(){
        var self = this;
        this.listen('help', function(from, interface, message){
            self.sendMessage('Yes Sir?', interface, from);
        })
    }

    return this;
}
