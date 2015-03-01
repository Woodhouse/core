var addDefaultPermissionToInterfaces = function(deps){
    this.deps = deps;
};

addDefaultPermissionToInterfaces.prototype = {
    up: function() {
        return this.deps.interfacePrefs.updateAsync({}, {$set: {default_permission: ''}}, { multi: true });
    }
};

module.exports = addDefaultPermissionToInterfaces;
