module.exports = function(deps){

    this.get = function(params){
        if (params.length > 0) {
            return this.getOne(params);
        }

        return deps.pluginPrefs.findAsync({}).then(function(docs){
            var returnDocs = [];
            for (var i = 0, len = docs.length; i < len; i++) {
                returnDocs.push({name: docs[i].name, enabled: docs[i].enabled})
            }
            return returnDocs;
        })
    };

    this.getOne = function(params){
        return deps.pluginPrefs.findOneAsync({name: params[0]})
    };

    this.put = function(params, body){
        if (params.length > 0) {
            return this.putOne(params, body);
        }
    };

    this.putOne = function(params, body){
        return deps.pluginPrefs.updateAsync({name: params[0]}, {$set: body}).then(function(){
            return deps.pluginPrefs.findOneAsync({name: params[0]});
        });
    };

    return this;
}
