'use strict';

const bluebird = require('bluebird');
const path = require('path');
const fs = bluebird.promisifyAll(require('fs'));

class moduleLoader {
    constructor(dispatcher, moduleData, systemPrefs, cron, yesNo, broadcast) {
        this.dispatcher = dispatcher;
        this.moduleData = moduleData;
        this.systemPrefs = systemPrefs;
        this.cron = cron;
        this.yesNo = yesNo;
        this.broadcast = broadcast;
        this.modules = {
            interface: {},
            plugin: {}
        };
    }

    getModules() {
        const moduleList = []
        return bluebird.each(Object.keys(this.modules), (type) => {
            return this.getModuleList(type).then((modules) => {
                moduleList.push(...modules);
            })
        }).then(() => {
            return moduleList;
        }).each((module) => {
            this.loadModule(module.module, module.type);
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
            // Return the type and folder name for use in the loading section
            return {
                type,
                module
            };
        });
    }

    loadModule(module, type) {
        const moduleClass = require(path.join('..', type, module));
        const moduleInstance = new moduleClass();

        // Check if the module is enabled
        return this.moduleData.get(type, moduleInstance.name, 'enabled').then((enabled) => {
            if (enabled === true) {
                // Store a reference to the module instance to use later
                this.modules[type][moduleInstance.name] = moduleInstance;

                // Add the core methods, run the init and then add any listener aliases
                this.addCoreMethods(moduleInstance, type);
                moduleInstance.init();

                if (type === 'plugin') {
                    this.dispatcher.loadListenerAliases({
                        name: moduleInstance.name,
                        displayname: moduleInstance.displayname
                    }, type);
                }

                return moduleInstance;
            }

            return false;
        }).catch((err) => {
            // If there are no prefs, then we need to add them
            if (err.shortCode === 'no-prefs') {
                return this.moduleData.addModule(moduleInstance, type).then(() => {
                    return false;
                });
            } else {
                return bluebird.reject(err);
            }
        });
    }

    addCoreMethods(module, type) {
        module.addMessageSender = this.dispatcher.addMessageSender.bind(this.dispatcher, module.name);
        module.messageRecieved = this.dispatcher.messageRecieved.bind(this.dispatcher, module.name);
        module.listen = this.dispatcher.listen.bind(this.dispatcher, {
            name: module.name,
            displayname: module.displayname
        });
        module.sendMessage = this.dispatcher.sendMessage.bind(this.dispatcher);
        module.registerCronHandler = this.cron.registerHandler.bind(this.cron, module.name);
        module.addCronJob = this.cron.add.bind(this.cron, module.name);
        module.removeCronJob = this.cron.remove.bind(this.cron);
        module.getPref = this.moduleData.getPref.bind(this.moduleData, type, module.name);
        module.getData = this.moduleData.get.bind(this.moduleData, type, module.name);
        module.getSystemPref = this.systemPrefs.get.bind(this.systemPrefs);
        module.addYesNoQuestion = this.yesNo.add.bind(this.yesNo);
        module.removeLastYesNoQuestion = this.yesNo.removeLast.bind(this.yesNo);
        module.getLastYesNoQuestion = this.yesNo.getLast.bind(this.yesNo);
        module.listenBroadcast = this.broadcast.listen.bind(this.broadcast, module.name);
    }

}

module.exports = moduleLoader;
