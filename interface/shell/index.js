'use strict';

const ipc = require(`node-ipc`);

ipc.config.id = `woodhousecore`;
ipc.config.retry = 1500;
ipc.config.silent = true;

class shell {
    constructor() {
        this.name = `shell`;
        this.displayname = `Shell`;
        this.description = `Issue commands through the command line`;
    }

    init() {
        this.sockets = [];
        this.getSystemPref(`name`).then((name) => {
            ipc.serve(() => {
                ipc.server.on(`app.message`, (message, socket) => {
                    this.sockets.push(socket);
                    this.messageRecieved(this.sockets.length - 1, `${name} ${message}`, `admin`);
                });

                this.addMessageSender((socket, message) => {
                    ipc.server.emit(this.sockets[socket], `app.message`, message);
                });
            });

            ipc.server.start();
        });
    }
}

module.exports = shell;
