'use strict';

const exec = require(`child_process`).exec;
const readline = require(`readline`);
const spinner = {
    interval: null,

    text:``,

    start: (text) => {
        const symbols = [`⠋`, `⠙`, `⠹`, `⠸`, `⠼`, `⠴`, `⠦`, `⠧`, `⠇`, `⠏`];
        spinner.text = text;
        spinner.interval = setInterval(() => {
            symbols.push(symbols.shift());
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`${symbols[0]} ${text}`);
        }, 100)
    },

    stop: (symbol = '', text = spinner.text) => {;
        clearInterval(spinner.interval);

        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(`${symbol} ${text}\n`);
    },

    succeed: (text) => {
        spinner.stop('✔', text);
    },

    fail: (text) => {
        spinner.stop('✘', text);
    }
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question(`What is the name of your instance?\n`, (name) => {
    spinner.start('Installing');
    exec(`npm install`, (err, stdout, stderr) => {
        spinner.succeed(`Installed core`);

        spinner.start('Doing initial setup of core');
        const nedb = require(`nedb`);


        exec(`node index.js --upgrade-only`, (err, stdout, stderr) => {
            if (stderr) {
                spinner.fail(`Setup failed. Error: ${stderr}`);
                rl.close();
            } else {
                spinner.succeed(`Core setup`);

                spinner.start('Setting name');

                const basePrefData = new nedb({ filename: 'base-prefs.db', autoload: true });

                basePrefData.update({name: `name`}, {$set: {value: name}}, function() {
                    spinner.succeed(`Name set`);

                    spinner.start('Installing shell client');

                    exec(`cd interface/shell; npm install -g`, (err, stdout, stderr) => {
                        if (stderr) {
                            spinner.fail(`Shell client install failed. You may need to run \`sudo npm install -g\` inside the \`interface/shell\` directory`);
                        } else {
                            spinner.succeed(`Client installed`);
                        }

                        rl.close();
                    });
                })
            }
        });
    });
});
