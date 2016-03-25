'use strict';

const bluebird = require('bluebird');

class systemPrefs {
    constructor(database) {
        this.database = database;
    }

    get(key) {
        return this.database.findOneAsync({name: key}).then((doc) => {
            if (doc === null) {
                let error = new Error('System pref ' + key + ' not found');
                error.shortCode = 'pref-not-found';
                return bluebird.reject(error);
            }

            return doc.value;
        });
    }

}

module.exports = systemPrefs;
