var promise = require('bluebird'),
    migrateUsersToNewStructure = function(deps){
        this.deps = deps;
    };

migrateUsersToNewStructure.prototype = {
    up: function() {
        return this.deps.users.findAsync({}).then(function(users) {
            return promise.map(users, function(user) {
                return this.deps.users.insertAsync({
                    username: user.name,
                    accounts:{[user.interface]: user.name},
                    role: user.role,
                    defaultAccount: user.interface
                }).then(function() {
                    return this.deps.users.removeAsync({_id: user._id});
                }.bind(this));
            }.bind(this));
        }.bind(this));
    }
};

module.exports = migrateUsersToNewStructure;
