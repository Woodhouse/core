var hangoutsBot = require("hangouts-bot");
var bot = new hangoutsBot("", "");

module.exports = function(func){
    var api = func;

    bot.on('online', function() {
        console.log('online');
    });

    bot.on('message', function(from, message) {
        api.messageRecieved(from, message)
    });

    api.addMessageSender('hangouts', function(message, to){
        bot.sendMessage(to, message);
    });
}
