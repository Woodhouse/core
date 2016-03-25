'use strict';

const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
const mockery = require('mockery');
const bluebird = require('bluebird');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('Module Loader', function() {
    let moduleLoader;

    const mockDispatcher = {
        addMessageSender: () => {
            return 'addMessageSender';
        },
        messageRecieved: () => {
            return 'messageRecieved';
        },
        listen: () => {
            return 'listen';
        },
        sendMessage: () => {
            return 'sendMessage';
        },
        loadListenerAliases: () => {
            return 'loadListenerAliases';
        }
    };

    const mockModuleData = {
        getPref: () => {
            return 'getPref';
        },
        get: (type, name, key) => {
            if (key === 'enabled') {
                if (name === 'testModule1') {
                    return bluebird.resolve(true);
                } else if (name === 'testModule2') {
                    return bluebird.resolve(false)
                } else if (name === 'testModule3') {
                    let error = new Error('No data found for ' + name);
                    error.shortCode = 'no-prefs';
                    return bluebird.reject(error);
                } else {
                    return bluebird.reject(new Error('error!'));
                }
            }

            return 'getData';
        },
        addModule: () => {
            return bluebird.resolve();
        }
    };

    const mockSystemPrefs = {
        get: () => {
            return 'getSystemPref';
        }
    }

    const mockCron = {
        add: () => {
            return 'add';
        },
        remove: () => {
            return 'remove';
        },
        registerHandler: () => {
            return 'registerHandler';
        }
    };

    before(function() {
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false,
            useCleanCache: true
        });

        mockery.registerMock('fs', {
            readdir: (path, callback) => {
                callback(null, [
                    'folder1',
                    'folder2',
                    'file1'
                ]);
            },
            stat: (path, callback) => {
                callback(null, {
                    isDirectory: () => {
                        return path !== 'test/file1';
                    }
                });
            }
        });

        mockery.registerMock('../plugin/testModule1', class testModule1 {
            constructor() {
                this.name = 'testModule1';
            }

            init() {
                this.initCalled = true;
            }
        });

        mockery.registerMock('../plugin/testModule2', class testModule2 {
            constructor() {
                this.name = 'testModule2';
            }
        });

        mockery.registerMock('../plugin/testModule3', class testModule3 {
            constructor() {
                this.name = 'testModule3';
            }
        });

        mockery.registerMock('../plugin/testModule4', class testModule4 {
            constructor() {
                this.name = 'testModule4';
            }
        });

        const moduleLoaderClass = require("../../lib/moduleLoader.js");
        moduleLoader = new moduleLoaderClass(mockDispatcher, mockModuleData, mockSystemPrefs, mockCron);
    });

    it('getmodulelist should only return folders', function() {
        const moduleList = moduleLoader.getModuleList('test');

        return expect(moduleList).to.eventually.deep.equal([
            {type: 'test', module: 'folder1'},
            {type: 'test', module: 'folder2'}
        ]);
    });

    it('addCoreMethods should make methods available on module', function() {
        const module = {}
        moduleLoader.addCoreMethods(module, 'test');

        expect(module).to.have.property('addMessageSender');
        expect(module.addMessageSender()).to.equal('addMessageSender');
        expect(module).to.have.property('messageRecieved');
        expect(module.messageRecieved()).to.equal('messageRecieved');
        expect(module).to.have.property('listen');
        expect(module.listen()).to.equal('listen');
        expect(module).to.have.property('sendMessage');
        expect(module.sendMessage()).to.equal('sendMessage');
        expect(module).to.have.property('registerCronHandler');
        expect(module.registerCronHandler()).to.equal('registerHandler');
        expect(module).to.have.property('addCronJob');
        expect(module.addCronJob()).to.equal('add');
        expect(module).to.have.property('removeCronJob');
        expect(module.removeCronJob()).to.equal('remove');
        expect(module).to.have.property('getPref');
        expect(module.getPref()).to.equal('getPref');
        expect(module).to.have.property('getData');
        expect(module.getData()).to.equal('getData');
        expect(module).to.have.property('getSystemPref');
        expect(module.getSystemPref()).to.equal('getSystemPref');
    });

    it('loadModule should load the module if it is enabled', function() {
        const module = moduleLoader.loadModule('testModule1', 'plugin');

        return expect(module).to.eventually.have.property('initCalled', true)
    });

    it('loadModule should not load the module if it is disabled', function() {
        const module = moduleLoader.loadModule('testModule2', 'plugin');

        return expect(module).to.eventually.be.false;
    });

    it('loadModule should not load the module if it does not exist in the db', function() {
        const module = moduleLoader.loadModule('testModule3', 'plugin');

        return expect(module).to.eventually.be.false;
    });

    it('loadModule should rethrow any exceptions besides the no-prefs one', function() {
        const module = moduleLoader.loadModule('testModule4', 'plugin');

        return expect(module).to.be.rejectedWith(Error, 'error!');
    });
})
