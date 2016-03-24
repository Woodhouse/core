'use strict';

const bluebird = require('bluebird');

class moduleData {
    constructor(interfacePrefs, pluginPrefs) {
        this.prefs = {
            'interface': interfacePrefs,
            'plugin': pluginPrefs
        }
    }

    getPref(moduleType, moduleName, prefKey) {
        return this.prefs[moduleType].findOneAsync({name: moduleName}).then((doc) => {
            if (doc === null) {
                let error = new Error('No preferences found for ' + moduleName);
                error.shortCode = 'no-prefs';
                return bluebird.reject(error);
            }

            const prefIndex = doc.prefs.findIndex((element) => {
                return element.name === prefKey
            });

            if (prefIndex > -1) {
                return doc.prefs[prefIndex].value;
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

            if (!doc[dataKey]) {
                let error = new Error('Data ' + dataKey + ' not found for module ' + moduleName);
                error.shortCode = 'pref-not-found';
                return bluebird.reject(error);
            }

            return doc[dataKey];
        });
    }

    addModule(moduleType, moduleInstance) {
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
