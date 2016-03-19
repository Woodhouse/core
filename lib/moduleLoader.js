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
        const moduleList = []
        return this.getModuleList('interfaces').then((interfaces) => {
            moduleList.push(...interfaces);

            return this.getModuleList('plugins')
        }).then((plugins) => {
            moduleList.push(...plugins);

            return moduleList;
        }).each((module) => {
            this.loadModule(module);
        });
    }

    getModuleList(type) {
        // Read the relevant folder to get the listing of potential modules and then loop over them
        return fs.readdirAsync(path.join('.', type)).filter((module) => {
            // Get the filesystem stats on the current module item
            return fs.statAsync(path.join('.', type, module)).then((stats) => {
                // If it's a directory, then we assume it's a module and can be loaded,
                // otherwise it's removed from the list
                return stats.isDirectory();
            })
        }).map((module) => {
            return {
                type,
                module
            };
        });
    }

    loadModule(module, type) {
        const moduleClass = require(path.join('..', type, module));
        const moduleInstance = new moduleClass();
    }

}

module.exports = moduleLoader;
