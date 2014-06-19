var Api = require('./api');
var api = new Api();
var fs = require("fs")

fs.readdirSync("./interfaces").forEach(function(file) {
    require("./interfaces/" + file)(api);
});
fs.readdirSync("./plugins").forEach(function(file) {
    require("./plugins/" + file)(api);
});
