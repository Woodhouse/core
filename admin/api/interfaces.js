var clone = require('clone');

module.exports = function(deps){

    this.get = function(params){
        var self = this;
        if (params.length > 0) {
            return this.getOne(params);
        }

        return deps.interfacePrefs.findAsync({}).then(function(docs){
            var prefs = [],
                returnDocs = [],
                formattedDoc;

            for (var i = 0, len = docs.length; i < len; i++) {
                formattedDoc = self.formatDoc(docs[i]);
                returnDocs.push(formattedDoc.interfaces);
                if (formattedDoc.prefs.length > 0) {
                    for (var a = 0, prefslen = formattedDoc.prefs.length; a < prefslen; a++) {
                        prefs.push(formattedDoc.prefs[a]);
                    }
                }
            }

            return {interfaces: returnDocs, prefs: prefs};
        })
    };

    this.getOne = function(params){
        var self = this;
        return deps.interfacePrefs.findOneAsync({name: params[0]}).then(function(doc){
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
                newDoc.prefs[a].interface = newDoc.id;

                if (newDoc.prefs[a].type === 'password') {
                    newDoc.prefs[a].value = '';
                }

                prefs.push(newDoc.prefs[a]);
                prefIds.push(newDoc.prefs[a].id);
            }

        }
        newDoc.prefs = prefIds;

        return {interfaces: newDoc, prefs: prefs};
    }

    this.put = function(params, body){
        if (params.length > 0) {
            return this.putOne(params, body);
        }
    };

    this.putOne = function(params, body){
        var self = this;
        return deps.interfacePrefs.updateAsync({name: params[0]}, {$set: body.interface}).then(function(){
            return deps.interfacePrefs.findOneAsync({name: params[0]}).then(function(doc){
                deps.api.reloadModule(doc.name, 'interfaces');
                return self.formatDoc(doc);
            });
        });
    };

    return this;
}
