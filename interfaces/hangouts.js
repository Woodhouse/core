var hangoutsBot = require("hangouts-bot");
var bot = new hangoutsBot("", "");

module.exports = function(api){

    bot.on('online', function() {
        api.addMessageSender('hangouts', function(message, to){
            bot.sendMessage(to, message);
        });
    });

    bot.on('message', function(from, message) {
        api.messageRecieved(from, message)
    });
}
