module.exports = function(api){
    api.listen('loadmodules','load modules', 'admin', function(from, interface){
        api.sendMessage('Loading new modules', interface, from);
        api.getModules();
    });
}
