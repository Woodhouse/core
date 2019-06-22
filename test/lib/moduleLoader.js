'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const mockery = require('mockery');
const bluebird = require('bluebird');
const sinon = require('sinon');
const nedb = require('nedb');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('Module Loader', function() {
    let moduleLoader;
    let sandbox;

    const interfacePrefData = bluebird.promisifyAll(new nedb({ filename: 'testinterface-prefs.db', autoload: true, inMemoryOnly: true }));
    const pluginPrefData = bluebird.promisifyAll(new nedb({ filename: 'testplugin-prefs.db', autoload: true, inMemoryOnly: true }));
    const basePrefData = bluebird.promisifyAll(new nedb({ filename: 'testbase-prefs.db', autoload: true, inMemoryOnly: true }));
    const usersData = bluebird.promisifyAll(new nedb({ filename: 'testusers.db', autoload: true, inMemoryOnly: true }));
    const cronData = bluebird.promisifyAll(new nedb({ filename: 'testcron.db', autoload: true, inMemoryOnly: true }));

    const broadcastClass = require('../../lib/broadcast.js');
    const yesNoClass = require('../../lib/yesNo.js');
    const usersClass = require('../../lib/users.js');
    const cronClass = require('../../lib/cron.js');
    const moduleDataClass = require('../../lib/moduleData.js');
    const systemPrefsClass = require('../../lib/systemPrefs.js');
    const dispatcherClass = require('../../lib/dispatcher.js');

    const broadcast = new broadcastClass();
    const yesNo = new yesNoClass();
    const users = new usersClass(usersData);
    const cron = new cronClass(cronData);
    const moduleData = new moduleDataClass(interfacePrefData, pluginPrefData);
    const systemPrefs = new systemPrefsClass(basePrefData);
    const dispatcher = new dispatcherClass(users, moduleData, systemPrefs);

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        sandbox.restore();
    });

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

        const moduleLoaderClass = require('../../lib/moduleLoader.js');
        moduleLoader = new moduleLoaderClass(dispatcher, moduleData, systemPrefs, cron, yesNo, broadcast);
    });

    it('getmodulelist should only return folders', function() {
        const moduleList = moduleLoader.getModuleList('test');

        return expect(moduleList).to.eventually.deep.equal([
            {type: 'test', module: 'folder1'},
            {type: 'test', module: 'folder2'}
        ]);
    });

    it('addCoreMethods should make methods available on module', function() {
        const broadcastStub = sandbox.stub(broadcast);
        const yesNoStub = sandbox.stub(yesNo);
        const usersStub = sandbox.stub(users);
        const cronStub = sandbox.stub(cron);
        const moduleDataStub = sandbox.stub(moduleData);
        const systemPrefsStub = sandbox.stub(systemPrefs);
        const dispatcherStub = sandbox.stub(dispatcher);
        const module = {}
        moduleLoader.addCoreMethods(module, 'test');

        expect(module).to.have.property('addMessageSender');
        module.addMessageSender();
        expect(dispatcherStub.addMessageSender.calledOnce).to.be.true;

        expect(module).to.have.property('messageRecieved');
        module.messageRecieved()
        expect(dispatcherStub.messageRecieved.calledOnce).to.be.true;

        expect(module).to.have.property('listen');
        module.listen();
        expect(dispatcherStub.listen.calledOnce).to.be.true;

        expect(module).to.have.property('sendMessage');
        module.sendMessage();
        expect(dispatcherStub.sendMessage.calledOnce).to.be.true;

        expect(module).to.have.property('registerCronHandler');
        module.registerCronHandler();
        expect(cronStub.registerHandler.calledOnce).to.be.true;

        expect(module).to.have.property('addCronJob');
        module.addCronJob();
        expect(cronStub.add.calledOnce).to.be.true;

        expect(module).to.have.property('removeCronJob');
        module.removeCronJob();
        expect(cronStub.remove.calledOnce).to.be.true;

        expect(module).to.have.property('getPref');
        module.getPref();
        expect(moduleDataStub.getPref.calledOnce).to.be.true;

        expect(module).to.have.property('getData');
        module.getData();
        expect(moduleDataStub.get.calledOnce).to.be.true;

        expect(module).to.have.property('getSystemPref');
        module.getSystemPref();
        expect(systemPrefsStub.get.calledOnce).to.be.true;
    });

    it('loadModule should load the module if it is enabled', function() {
        const moduleDataGetStub = sandbox.stub(moduleData, 'get');
        moduleDataGetStub.returns(bluebird.resolve(true));
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
        const moduleDataGetStub = sandbox.stub(moduleData, 'get');
        moduleDataGetStub.returns(bluebird.reject(new Error('error!')));
        const module = moduleLoader.loadModule('testModule4', 'plugin');

        return expect(module).to.be.rejectedWith(Error, 'error!');
    });
})
