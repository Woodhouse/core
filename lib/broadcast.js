`use strict`;

const bluebird = require(`bluebird`);
const dgram = require(`dgram`);

class broadcast {
    constructor() {
        this.listeners = {};
        this.socket = bluebird.promisifyAll(dgram.createSocket({
            type: 'udp4',
            reuseAddr: true
        }));

        this.socket.bindAsync(9600).then(() => {
            this.socket.setBroadcast(true);
        });

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

    send(module, object) {
        const message = {
            source: `woodhouse-${module.name}`,
            message: object
        };

        return this.socket.sendAsync(JSON.stringify(message), 9600, '255.255.255.255').then(() => {
            return true;
        });
    }
}

module.exports = broadcast;
