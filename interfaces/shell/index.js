module.exports = function() {

    this.name = 'shell';
    this.displayname = 'Shell';
    this.description = 'Issue commands through the command line';

    this.init = function() {
        var readline = require('readline');
        var stdin = process.openStdin();
        var stdout = process.stdout;
        var cli = readline.createInterface(stdin, stdout, null);
        var self = this;

        this.api.addMessageSender('shell', function(message, to){
            console.log('\n' + message);
            cli.prompt(true);
        });

        cli.on('line', function(command){
            cli.prompt(true);
            self.api.messageRecieved(null, 'shell', 'woodhouse ' + command)
        });

        cli.on('close', function() {
            stdin.destroy();
            console.log('');
            process.exit(0);
        });

        cli.setPrompt("" + this.api.name + " > ");
        cli.prompt();
    }

    return this;
}


