var shell = function() {

    this.name = 'shell';
    this.displayname = 'Shell';
    this.description = 'Issue commands through the command line';
    this.moduleStopped = false;
}

shell.prototype.init = function() {
    var rl = require('readline-history');
    var stdin = process.openStdin();
    var stdout = process.stdout;
    var self = this;

    rl.createInterface({
        input: stdin,
        output: stdout,
        path: __dirname + '/history',
        maxLength: 1024000,
        next: function(cli){
            self.cli = cli;
            self.cli.on('line', function(command){
                self.cli.prompt(true);
                if (command === 'exit') {
                    return process.exit(0);
                }
                self.messageRecieved('admin', self.api.name + ' ' + command)
            });

            self.cli.on('close', function() {
                // stdin.destroy();
                console.log('');
                if (!self.moduleStopped) {
                    process.exit(0);
                }
            });

            self.cli.setPrompt("" + self.api.name + " > ");
            self.cli.prompt();
        }
    });

    this.addMessageSender(function(message, to){
        console.log('\n' + message);
        self.cli.prompt(true);
    });
}

shell.prototype.exit = function(){
    this.moduleStopped = true;
    this.cli.close();
}

module.exports = shell;
