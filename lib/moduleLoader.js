'use strict';

const bluebird = require('bluebird');
const path = require('path');
const fs = bluebird.promisifyAll(require('fs'));

class moduleLoader {
    constructor(dispatcher, modulePrefs) {
        this.dispatcher = dispatcher;
        this.modulePrefs = modulePrefs;
    }

    getModules() {
        for (let type of ['interfaces', 'plugins']) {
            // Read the interface or plugin directory to get the listing of modules and then iterate over it
            fs.readdirAsync(path.join('.', type)).filter((module) => {
                // Get the filesystem stats on the current module item
                return fs.statAsync(path.join('.', type, module)).then((stats) => {
                    // If it's a directory, then we assume it's a module and can be loaded,
                    // otherwise it's removed from the list
                    return stats.isDirectory();
                })
            }).each((module) => {
                this.loadModule(module, type);
            });
        }
    }

    loadModule(module, type) {
        const moduleClass = require(path.join('..', type, module));
        const moduleInstance = new moduleClass();
    }
}

module.exports = moduleLoader;
