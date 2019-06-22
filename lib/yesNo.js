'use strict';

const promise = require('bluebird');

class yesNo {
    constructor() {
        this.questions = {};
    }

    add(user, question, yesCallback, noCallback) {
        if (!this.questions[user]) {
            this.questions[user] = [];
        }

        this.questions[user].push({
            question,
            yesCallback,
            noCallback
        });

        return promise.resolve(true);
    }

    removeLast(user) {
        if (!this.questions[user]) {
            this.questions[user] = [];
        }

        this.questions[user].pop();

        return promise.resolve(true);
    }

    getLast(user) {
        if (!this.questions[user]) {
            this.questions[user] = [];
        }

        return promise.resolve(this.questions[user][this.questions[user].length - 1]);
    }
}

module.exports = yesNo;
