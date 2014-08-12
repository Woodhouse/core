module.exports = function(){

    this.name = 'help';

    this.init = function(){
        var self = this;
        this.api.listen('help', function(from, interface, message){
            self.api.sendMessage('Yes Sir?', interface, from);
        })
    }

    return this;
}
