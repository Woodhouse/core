var shell = function() {

    this.name = 'shell';
    this.displayname = 'Shell';
    this.description = 'Issue commands through the command line';
    this.moduleStopped = false;
}

shell.prototype.init = function() {
    var readline = require('readline');
    var stdin = process.openStdin();
    var stdout = process.stdout;
    var self = this;

    this.cli = readline.createInterface(stdin, stdout, null);

    this.addMessageSender(function(message, to){
        console.log('\n' + message);
        self.cli.prompt(true);
    });

    this.cli.on('line', function(command){
        self.cli.prompt(true);
        if (command.match("load modules")){
            console.log('\nLoading new modules')
            self.cli.prompt(true);
            self.api.getModules();
        } else {
            self.messageRecieved(null, 'woodhouse ' + command)
        }
    });

    this.cli.on('close', function() {
        // stdin.destroy();
        console.log('');
        if (!self.moduleStopped) {
            process.exit(0);
        }
    });

    this.cli.setPrompt("" + this.api.name + " > ");
    this.cli.prompt();
}

shell.prototype.exit = function(){
    this.moduleStopped = true;
    this.cli.close();
}

module.exports = shell;
