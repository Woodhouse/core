var clone = require('clone');

module.exports = function(deps){

    this.get = function(params){
        var self = this;

        if (params.length > 0) {
            return this.getOne(params);
        }

        return deps.basePrefs.findAsync({}).then(function(docs){
            var prefs = [],
                returnDocs = [],
                formattedDoc;

            for (var i = 0, len = docs.length; i < len; i++) {
                formattedDoc = self.formatDoc(docs[i]);
                prefs.push(formattedDoc.id);
                returnDocs.push(formattedDoc);
            }

            return {prefs: returnDocs};
        })
    };

    this.getOne = function(params){
        var self = this;

        return deps.basePrefs.findOneAsync({name: params[0]}).then(function(doc){
            var newDoc = self.formatDoc(doc)

            return {prefs: newDoc};
        });
    };

    this.formatDoc = function(doc){
        var prefs = [],
            prefIds = [],
            newDoc = clone(doc);

        newDoc.id = newDoc._id;
        delete newDoc._id;

        return newDoc;
    }

    this.put = function(params, body){
        if (params.length > 0) {
            return this.putOne(params, body);
        }
    };

    this.putOne = function(params, body){
        var self = this;

        return deps.basePrefs.updateAsync({_id: params[0]}, {$set: body.pref}).then(function(){
            return deps.basePrefs.findOneAsync({_id: params[0]}).then(function(doc){
                return {prefs: self.formatDoc(doc)};
            });
        });
    };

    return this;
}
