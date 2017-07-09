'use strict';

class say {
    constructor() {
        this.name = 'say';
        this.displayname = 'Say';
        this.description = 'Make woodhouse say things back to you';
    }

    init() {
        var self = this;
        self.listen(
            'say',
            '(say|tell) (:<message>.+?)',
            'standard',
            (from, interfaceName, params) => {
                return params.message;
            }
        )

        self.listen(
            'say-steals',
            'who steals cars(\\?|)',
            'standard',
            (from, interfaceName) => {
                // Archer quote: https://www.youtube.com/watch?v=h8P2BPHmqsg
                return `GYPPOS!`;
            }
        )
    }
}

module.exports = say;
