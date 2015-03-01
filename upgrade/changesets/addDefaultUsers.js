var addDefaultUsers = function(deps){
    this.deps = deps;
};

addDefaultUsers.prototype = {
    up: function() {
        return this.deps.users.insertAsync({
            'name':'admin',
            'interface':'shell',
            'role':'admin'
        });
    }
};

module.exports = addDefaultUsers;
