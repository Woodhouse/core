'use strict';

class say {
    constructor() {
        this.name = 'say';
        this.displayname = 'Say';
        this.description = 'Make woodhouse say things back to you';
    }

    init() {
        this.listen('(say|tell) (:<message>.+?)', 'standard', (from, interfaceName, params) => {
            this.sendMessage(from, interfaceName, params[1]);
        })

        this.listen('who steals cars\\?', 'standard', (from, interfaceName) => {
            this.sendMessage(from, interfaceName, 'GYPPOS!');
        })
    }
}

module.exports = say;
