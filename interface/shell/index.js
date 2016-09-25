'use strict';

const readline = require('readline-history');
const stdin = process.openStdin();
const stdout = process.stdout;

class shell {
    constructor() {
        this.name = 'shell';
        this.displayname = 'Shell';
        this.description = 'Issue commands through the command line';
    }

    init() {
        this.getSystemPref('name').then((name) => {
            readline.createInterface({
                input: stdin,
                output: stdout,
                path: `${__dirname}/history`,
                maxLength: 1024000,
                next: (cli) => {
                    this.cli = cli;
                    this.cli.on('line', (command) => {
                        if (command === 'exit') {
                            return process.exit();
                        }
                        this.cli.prompt(true);
                        this.messageRecieved('admin', `${name} ${command}`)
                    });

                    this.cli.on('close', () => {
                        console.log('');
                        process.exit();
                    });

                    this.cli.setPrompt(`${name}> `);
                    this.cli.prompt();
                }
            });

            this.addMessageSender((to, message) => {
                console.log(`\n${message}`);
                this.cli.prompt(true);
            });
        });
    }
}

module.exports = shell;
