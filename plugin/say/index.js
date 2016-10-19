'use strict';

class say {
    constructor() {
        this.name = 'say';
        this.displayname = 'Say';
        this.description = 'Make woodhouse say things back to you';
    }

    init() {
        this.listen('(say|tell) (:<message>.+?)', 'standard', (from, interfaceName, params) => {
            return params[1];
        })

        this.listen('who steals cars\\?', 'standard', (from, interfaceName) => {
            return `GYPPOS!`;
        })
    }
}

module.exports = say;
