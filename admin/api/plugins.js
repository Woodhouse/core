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
                listenerAliases = [],
                formattedDoc;

            for (var i = 0, len = docs.length; i < len; i++) {
                formattedDoc = self.formatDoc(docs[i]);
                returnDocs.push(formattedDoc.plugins);

                if (formattedDoc.prefs.length > 0) {
                    Array.prototype.push.apply(prefs, formattedDoc.prefs)
                }

                if (formattedDoc.prefs.length > 0) {
                    Array.prototype.push.apply(prefs, formattedDoc.prefs)
                }

                if (formattedDoc.listeneraliases.length > 0) {
                    Array.prototype.push.apply(listenerAliases, formattedDoc.listeneraliases)
                }
            }

            return {plugins: returnDocs, prefs: prefs, listeneraliases: listenerAliases};
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
            newPrefsTemplateIds = [],
            newDoc = clone(doc),
            listeners = {},
            listenerAliases = [],
            listenerAliasIds = [];

        newDoc.id = newDoc.name;
        delete newDoc._id;

        for (var key in deps.api.listeners) {
            if (deps.api.listeners[key].module.name === doc.name && !deps.api.listeners[key].isAlias) {
                listeners[deps.api.listeners[key].listener] = {
                    id: deps.api.listeners[key].module.name + deps.api.listeners[key].listener,
                    listener: deps.api.listeners[key].listener.replace(
                        /(\((:<(.+?)>)*([\(].+?[\)])*(.+?)\))/g,
                        function (group, groupinner, namegroup, name) {
                            if (typeof name !== 'undefined') {
                                return '<<' + name + '>>'
                            }

                            return group;
                        }
                    ),
                    alias: ''
                };
                listenerAliasIds.push(deps.api.listeners[key].module.name + deps.api.listeners[key].listener);

                if (doc.listeneraliases && doc.listeneraliases.length > 0) {
                    doc.listeneraliases.forEach(function() {
                        listeners[deps.api.listeners[key].listener].alias = doc.listeneraliases.alias
                    });
                }
            }
        }

        listenerAliases = Object.keys(listeners).map(function (key) {return listeners[key]});
        newDoc.listeneraliases = listenerAliasIds;

        if (typeof newDoc.prefs !== 'undefined') {

            for (var a = 0, preflen = newDoc.prefs.length; a < preflen; a++) {
                newDoc.prefs[a].id = newDoc.name + newDoc.prefs[a].name;

                if (newDoc.prefs[a].group) {
                    newDoc.prefs[a].id += newDoc.prefs[a].group;
                }

                newDoc.prefs[a].plugin = newDoc.id;

                if (newDoc.prefs[a].type === 'password') {
                    newDoc.prefs[a].value = '';
                }

                prefs.push(newDoc.prefs[a]);
                prefIds.push(newDoc.prefs[a].id);
            }

        }
        newDoc.prefs = prefIds;

        if (typeof newDoc.newPrefsTemplate !== 'undefined') {
            for (var a = 0, preflen = newDoc.newPrefsTemplate.length; a < preflen; a++) {
                newDoc.newPrefsTemplate[a].id = newDoc.name + newDoc.newPrefsTemplate[a].name;
                newDoc.newPrefsTemplate[a].plugin = newDoc.id;

                prefs.push(newDoc.newPrefsTemplate[a]);
                newPrefsTemplateIds.push(newDoc.newPrefsTemplate[a].id);
            }
        }

        newDoc.newPrefsTemplate = newPrefsTemplateIds
        return {plugins: newDoc, prefs: prefs, listeneraliases: listenerAliases};
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
                return deps.api.reloadModule(doc.name, 'plugins').then(function() {
                    return self.formatDoc(doc);
                });
            });
        });
    };

    return this;
}
