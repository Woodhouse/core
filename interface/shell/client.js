#! /usr/bin/env node

'use strict';

const ipc = require(`node-ipc`);
const message = process.argv.slice(2).join(` `);

ipc.config.id = `woodhouseshellclient`;
ipc.config.retry = 1000;
ipc.config.silent = true;

ipc.connectTo(`woodhousecore`, () => {
    ipc.of.woodhousecore.on(`connect`, () => {
        ipc.of.woodhousecore.emit(`app.message`, message);
    });

    ipc.of.woodhousecore.on(`app.message`, (message) => {
        console.log(message);
        ipc.disconnect(`woodhousecore`);
    });
});
