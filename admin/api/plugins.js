var clone = require('clone');

module.exports = function(deps){

    this.get = function(params){
        var self = this;
        if (params.length > 0) {
            return this.getOne(params);
        }

        return deps.pluginPrefs.findAsync({}).then(function(docs){
            var prefs = [],
                returnDocs = [],
                formattedDoc;

            for (var i = 0, len = docs.length; i < len; i++) {
                formattedDoc = self.formatDoc(docs[i]);
                returnDocs.push(formattedDoc.plugins);
                if (formattedDoc.prefs.length > 0) {
                    for (var a = 0, prefslen = formattedDoc.prefs.length; a < prefslen; a++) {
                        prefs.push(formattedDoc.prefs[a]);
                    }
                }
            }

            return {plugins: returnDocs, prefs: prefs};
        })
    };

    this.getOne = function(params){
        var self = this;
        return deps.pluginPrefs.findOneAsync({name: params[0]}).then(function(doc){
            return self.formatDoc(doc);
        });
    };

    this.formatDoc = function(doc){
        var prefs = [],
            prefIds = [],
            newDoc = clone(doc);

        newDoc.id = newDoc.name;
        delete newDoc._id;

        if (typeof newDoc.prefs !== 'undefined') {

            for (var a = 0, preflen = newDoc.prefs.length; a < preflen; a++) {
                newDoc.prefs[a].id = newDoc.name + newDoc.prefs[a].name;
                newDoc.prefs[a].plugin = newDoc.id;

                if (newDoc.prefs[a].type === 'password') {
                    newDoc.prefs[a].value = '';
                }

                prefs.push(newDoc.prefs[a]);
                prefIds.push(newDoc.prefs[a].id);
            }

        }
        newDoc.prefs = prefIds;

        return {plugins: newDoc, prefs: prefs};
    }

    this.put = function(params, body){
        if (params.length > 0) {
            return this.putOne(params, body);
        }
    };

    this.putOne = function(params, body){
        var self = this;
        return deps.pluginPrefs.updateAsync({name: params[0]}, {$set: body.plugin}).then(function(){
            return deps.pluginPrefs.findOneAsync({name: params[0]}).then(function(doc){
                deps.api.reloadModule(doc.name, 'plugins');
                return self.formatDoc(doc);
            });
        });
    };

    return this;
}
