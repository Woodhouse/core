var addBasePrefs = function(deps){
    this.deps = deps;
};

addBasePrefs.prototype = {
    up: function() {
        return this.deps.basePrefs.insertAsync([
            {
                'name': 'default_permission',
                'type':'text',
                'value':'standard',
                'group':null
            },
            {
                'name':'port',
                'type':'text',
                'value':'8080',
                'group':null
            },
            {
                'name':'name',
                'type':'text',
                'value':'Woodhouse',
                'group':null
            }
        ]);
    }
};

module.exports = addBasePrefs;
