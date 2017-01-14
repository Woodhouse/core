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
        this.getSystemPref(`name`).then((name) => {
            ipc.serve(() => {
                ipc.server.on(`app.message`, (message, socket) => {
                    this.messageRecieved(socket, `${name} ${message}`, `admin`);
                });

                this.addMessageSender((socket, message) => {
                    ipc.server.emit(socket, `app.message`, message);
                });
            });

            ipc.server.start();
        });
    }
}

module.exports = shell;
