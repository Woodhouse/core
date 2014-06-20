var Api = require('./api');
var api = new Api();
var fs = require("fs")

fs.readdirSync("./interfaces").forEach(function(file) {
    require("./interfaces/" + file)(api);
});
fs.readdirSync("./plugins").forEach(function(file) {
    require("./plugins/" + file)(api);
});

api.listen('yes', function(from, message){
    var yesNoQuestion = api.returnLastYesNoQuestion();
    if (yesNoQuestion) {
        yesNoQuestion.yesCallback();
        api.removeLastYesNoQuestion();
    }
});

api.listen('no', function(from, message){
    var yesNoQuestion = api.returnLastYesNoQuestion();
    if (yesNoQuestion) {
        yesNoQuestion.noCallback();
        api.removeLastYesNoQuestion();
    }
});

api.listen('next question', function(from, message){
    var yesNoQuestion = api.returnLastYesNoQuestion();
    if (yesNoQuestion) {
        api.sendMessage(yesNoQuestion.question, interface, from);
    } else {
        api.sendMessage('No more questions to ask!', interface, from);
    }
});
