module.exports = function(api){
    api.listen('yes', function(from, message){
        var yesNoQuestion = api.returnLastYesNoQuestion();
        if (yesNoQuestion) {
            if (typeof yesNoQuestion.yesCallback === 'function') {
                yesNoQuestion.yesCallback();
            }
            api.removeLastYesNoQuestion();
        }
    });

    api.listen('no', function(from, message){
        var yesNoQuestion = api.returnLastYesNoQuestion();
        if (yesNoQuestion) {
            if (typeof yesNoQuestion.noCallback === 'function') {
                yesNoQuestion.noCallback();
            }
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
}