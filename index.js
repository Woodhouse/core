var Api = require('./api');
var api = new Api();
var fs = require("fs");

require('./lib/yesno.js')(api);

fs.readdirSync("./interfaces").forEach(function(file) {
    fs.stat("./interfaces/" + file, function(err, stats){
        if (stats.isDirectory()) {
            require("./interfaces/" + file)(api);
        }
    });
});
fs.readdirSync("./plugins").forEach(function(file) {
    fs.stat("./plugins/" + file, function(err, stats){
        if (stats.isDirectory()) {
            require("./plugins/" + file)(api);
        }
    });
});
