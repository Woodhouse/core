var YesNo = function(){

}

YesNo.prototype = {
    yesNoQuestions: {},

    addYesNoQuestion: function(user, question, yesCallback, noCallback){
        if (!this.yesNoQuestions[user]) {
            this.yesNoQuestions[user] = [];
        }

        this.yesNoQuestions[user].push({question: question, yesCallback: yesCallback, noCallback: noCallback});
    },

    removeLastYesNoQuestion: function(user){
        if (!this.yesNoQuestions[user]) {
            this.yesNoQuestions[user] = [];
        }

        this.yesNoQuestions[user].pop();
    },

    returnLastYesNoQuestion: function(user){
        if (!this.yesNoQuestions[user]) {
            this.yesNoQuestions[user] = [];
        }

        return this.yesNoQuestions[user][this.yesNoQuestions[user].length - 1];
    }
};

module.exports = YesNo;
