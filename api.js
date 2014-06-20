var api = function(){
    this.listeners = [];
    this.messageSenders = {};
    this.yesNoQuestions = [];
};

api.prototype.listen = function(listener, command){
    this.listeners.push({listener: listener, command: command});
}

api.prototype.messageRecieved = function(from, message) {
    for (var i = 0, len = this.listeners.length; i < len; i++) {
        var regex = new RegExp("woodhouse "+ this.listeners[i].listener + "$", 'i'),
            match = regex.exec(message);
        if (match) {
            match.shift();
            this.listeners[i].command(from, match);
        }
    }
}

api.prototype.addMessageSender = function(name, command){
    this.messageSenders[name] = command;
}

api.prototype.sendMessage = function(message, sender, to){
    if (sender) {
        this.messageSenders[sender](message, to);
    } else {
        for (var sender in this.messageSenders) {
            this.messageSenders[sender](message, to);
        }
    }
}

api.prototype.addYesNoQuestion = function(question, yesCallback, noCallback){
    this.yesNoQuestions.push({question: question, yesCallback: yesCallback, noCallback: noCallback});
}

api.prototype.removeLastYesNoQuestion = function(){
    this.yesNoQuestions.pop();
}

api.prototype.returnLastYesNoQuestion = function(){
    return this.yesNoQuestions[this.yesNoQuestions.length - 1];
}

module.exports = api;
