var api = function(){
    this.listeners = [];
    this.messageSenders = {};
    this.yesNoQuestions = [];
    this.name = 'woodhouse';
};

api.prototype.listen = function(listener, command){
    this.listeners.push({listener: listener, command: command});
}

api.prototype.messageRecieved = function(from, interface, message) {
    for (var i = 0, len = this.listeners.length; i < len; i++) {
        var regex = new RegExp("^" + this.name + " "+ this.listeners[i].listener + "$", 'i'),
            match = regex.exec(message);
        if (match) {
            match.shift();
            this.listeners[i].command(from, interface, match);
        }
    }
}

api.prototype.addMessageSender = function(name, command){
    this.messageSenders[name] = command;
}

api.prototype.sendMessage = function(message, interface, to){
    if (interface) {
        this.messageSenders[interface](message, to);
    } else {
        for (var interface in this.messageSenders) {
            this.messageSenders[interface](message, to);
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
