module.exports = function(api) {
    var readline = require('readline');
    var stdin = process.openStdin();
    var stdout = process.stdout;
    var cli = readline.createInterface(stdin, stdout, null);

    api.addMessageSender('shell', function(message, to){
        console.log('\n' + message);
        cli.prompt(true);
    });

    cli.on('line', function(command){
        cli.prompt(true);
        api.messageRecieved(null, 'shell', 'woodhouse ' + command)
    });

    cli.on('close', function() {
        stdin.destroy();
        console.log('');
        process.exit(0);
    });

    cli.setPrompt("" + api.name + " > ");
    cli.prompt();
}
