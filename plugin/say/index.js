'use strict';

class say {
    constructor() {
        this.name = 'say';
        this.displayname = 'Say';
        this.description = 'Make woodhouse say things back to you';
    }

    init() {
        var self = this;
        self.listen({
            id: 'say',
            listener: '(say|tell) (:<message>.+?)',
            role: 'standard',
            command: (from, interfaceName, params) => {
                return params.message;
            }
        })

        self.listen({
            id: 'steals',
            listener: 'who steals cars(\\?|)',
            role: 'standard',
            command: (from, interfaceName) => {
                // Archer quote: https://www.youtube.com/watch?v=h8P2BPHmqsg
                return `GYPPOS!`;
            }
        })
    }
}

module.exports = say;
