'use strict';

const bluebird = require('bluebird');

class moduleData {
    constructor(interfacePrefs, pluginPrefs) {
        this.prefs = {
            'interface': interfacePrefs,
            'plugin': pluginPrefs
        }
    }

    getAllPrefs(moduleType, moduleName) {
        return this.prefs[moduleType].findOneAsync({name: moduleName}).then((doc) => {
            if (doc === null || doc.prefs.length === 0) {
                let error = new Error('No preferences found for ' + moduleName);
                error.shortCode = 'no-prefs';
                return bluebird.reject(error);
            }

            return doc.prefs;
        });
    }

    getPref(moduleType, moduleName, prefKey) {
        return this.getAllPrefs(moduleType, moduleName).then((prefs) => {
            const prefIndex = prefs.findIndex((element) => {
                return element.name === prefKey
            });

            if (prefIndex > -1) {
                return prefs[prefIndex].value;
            }

            let error = new Error('Preference ' + prefKey + ' not found for module ' + moduleName);
            error.shortCode = 'pref-not-found';
            return bluebird.reject(error);
        });
    }

    get(moduleType, moduleName, dataKey) {
        return this.prefs[moduleType].findOneAsync({name: moduleName}).then((doc) => {
            if (doc === null) {
                let error = new Error('No data found for ' + moduleName);
                error.shortCode = 'no-prefs';
                return bluebird.reject(error);
            }

            if (typeof doc[dataKey] === 'undefined') {
                let error = new Error('Data ' + dataKey + ' not found for module ' + moduleName);
                error.shortCode = 'data-not-found';
                return bluebird.reject(error);
            }

            return doc[dataKey];
        });
    }

    set(moduleType, moduleName, dataKey, value) {
        return this.prefs[moduleType].findOneAsync({name: moduleName}).then((doc) => {
            if (doc === null) {
                let error = new Error('No data found for ' + moduleName);
                error.shortCode = 'no-prefs';
                return bluebird.reject(error);
            }

            return this.prefs[moduleType].update({name: moduleName}, {$set:{[dataKey]: value}});
        }).then((updatedDocs) => {
            return true;
        });
    }

    addModule(moduleInstance, moduleType) {
        if (!moduleInstance.name) {
            let error = new Error('No name set for new module');
            error.shortCode = 'invalid-params';
            return bluebird.reject(error);
        }

        return this.prefs[moduleType].insertAsync({
            name: moduleInstance.name,
            displayname: moduleInstance.displayname || '',
            description: moduleInstance.description || '',
            enabled: false,
            default_permission: '',
            canAddNewPrefs: moduleInstance.canAddNewPrefs || false,
            prefs: moduleInstance.defaultPrefs || [],
            newPrefsTemplate: moduleInstance.newPrefsTemplate || []
        });
    }
}

module.exports = moduleData;
