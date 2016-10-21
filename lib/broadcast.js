`use strict`;

const bluebird = require(`bluebird`);
const dgram = require(`dgram`);

class broadcast {
    constructor() {
        this.listeners = {};
        this.socket = bluebird.promisifyAll(dgram.createSocket('udp4'));

        this.socket.bind(9600);

        this.socket.on('message', this.messageRecieved.bind(this));
    }

    listen(module, source, command) {
        if (!this.listeners[source]) {
            this.listeners[source] = [];
        }

        this.listeners[source].push({
            module,
            command
        });
    }

    messageRecieved(message) {
        message = message.toString();

        try {
            message = JSON.parse(message);

            if (typeof message !== 'object') {
                return;
            }
        } catch(e) {
            return;
        }

        if (message.source && this.listeners[message.source]) {
            this.listeners[message.source].forEach((listener) => {
                listener.command(message);
            });
        }
    }
}

module.exports = broadcast;