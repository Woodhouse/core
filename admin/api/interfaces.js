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
            prefIds = [];

        doc.id = doc.name;
        delete doc._id;

        if (typeof doc.prefs !== 'undefined') {

            for (var a = 0, preflen = doc.prefs.length; a < preflen; a++) {
                doc.prefs[a].id = doc.name + doc.prefs[a].name;
                doc.prefs[a].interface = doc.id;

                if (doc.prefs[a].type === 'password') {
                    doc.prefs[a].value = '';
                }

                prefs.push(doc.prefs[a]);
                prefIds.push(doc.prefs[a].id);
            }

        }
        doc.prefs = prefIds;

        return {interfaces: doc, prefs: prefs};
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
                return self.formatDoc(doc);
            });
        });
    };

    return this;
}
