'use strict';

const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
const nedb = require('nedb');
const bluebird = require('bluebird');

const testInterfaceDb = bluebird.promisifyAll(new nedb({ filename: 'testInterfaces.db', autoload: true, inMemoryOnly: true}));
const testPluginDb = bluebird.promisifyAll(new nedb({ filename: 'testPlugins.db', autoload: true, inMemoryOnly: true}));

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('Module Preferences', function() {
    let moduleData;
    before(function(done) {
        testInterfaceDb.insertAsync({
            name: 'interface1',
            enabled: false,
            prefs: [
                {
                    name: 'interface1-pref1-name',
                    value: 'interface1-pref1-value'
                },
                {
                    name: 'interface1-pref2-name',
                    value: 'interface1-pref2-value'
                }
            ]
        }).then(() => {
            return testInterfaceDb.insertAsync({
                name: 'interface2',
                enabled: true,
                prefs: [
                    {
                        name: 'interface2-pref1-name',
                        value: 'interface2-pref1-value'
                    },
                    {
                        name: 'interface2-pref2-name',
                        value: 'interface2-pref2-value'
                    }
                ]
            })
        }).then(() => {
            return testPluginDb.insertAsync({
                name: 'plugin1',
                enabled: false,
                prefs: [
                    {
                        name: 'plugin1-pref1-name',
                        value: 'plugin1-pref1-value'
                    },
                    {
                        name: 'plugin1-pref2-name',
                        value: 'plugin1-pref2-value'
                    }
                ]
            })
        }).then(() => {
            return testPluginDb.insertAsync({
                name: 'plugin2',
                enabled: false,
                prefs: [
                    {
                        name: 'plugin2-pref1-name',
                        value: 'plugin2-pref1-value'
                    },
                    {
                        name: 'plugin2-pref2-name',
                        value: 'plugin2-pref2-value'
                    }
                ]
            })
        }).then(() => {
            const moduleDataClass = require("../../lib/moduleData.js");
            moduleData = new moduleDataClass(testInterfaceDb, testPluginDb);
            done();
        });
    });

    it('get returns the correct value', function() {
        const moduleList = moduleData.getPref('plugin', 'plugin1', 'plugin1-pref1-name');

        return expect(moduleList).to.eventually.equal('plugin1-pref1-value');
    });

    it('get throws an exception if pref does not exist', function() {
        const moduleList = moduleData.getPref('plugin', 'plugin1', 'non-existant');

        return expect(moduleList).to.be.rejectedWith(Error, 'Preference non-existant not found for module plugin1');
    });

    it('get throws an exception if module not found', function() {
        const moduleList = moduleData.getPref('plugin', 'fake', 'non-existant');

        return expect(moduleList).to.be.rejectedWith(Error, 'No preferences found for fake');
    });

    it('get returns the correct value', function() {
        const enabled = moduleData.get('interface', 'interface2', 'enabled');

        return expect(enabled).to.eventually.be.true;
    });

    it('get throws an exception if module not found', function() {
        const enabled = moduleData.get('plugin', 'fake', 'enabled');

        return expect(enabled).to.be.rejectedWith(Error, 'No data found for fake');
    });

        it('get throws an exception if data key not found', function() {
        const enabled = moduleData.get('plugin', 'plugin1', 'fake');

        return expect(enabled).to.be.rejectedWith(Error, 'Data fake not found for module plugin1');
    });

    it('addModule throws an exception if module name is null', function() {
        const module = moduleData.addModule('plugin', {});

        return expect(module).to.be.rejectedWith(Error, 'No name set for new module');
    });

    it('addModule sets properties to defaults if not set', function() {
        const module = moduleData.addModule('plugin', {name: 'test'});

        return bluebird.all([
            expect(module).to.eventually.have.property('name', 'test'),
            expect(module).to.eventually.have.property('displayname', ''),
            expect(module).to.eventually.have.property('description', ''),
            expect(module).to.eventually.have.property('enabled', false),
            expect(module).to.eventually.have.property('default_permission', ''),
            expect(module).to.eventually.have.property('canAddNewPrefs', false),
            expect(module).to.eventually.have.property('prefs').and.be.empty,
            expect(module).to.eventually.have.property('newPrefsTemplate').and.be.empty
        ]);
    });

    it('addModule sets properties to set values', function() {
        const module = moduleData.addModule('plugin', {
            name: 'testname',
            displayname: 'testdisplayname',
            description: 'testdescription',
            canAddNewPrefs: true,
            defaultPrefs: ['testpref'],
            newPrefsTemplate: ['testpreftemplate']
        });

        return bluebird.all([
            expect(module).to.eventually.have.property('name', 'testname'),
            expect(module).to.eventually.have.property('displayname', 'testdisplayname'),
            expect(module).to.eventually.have.property('description', 'testdescription'),
            expect(module).to.eventually.have.property('enabled', false),
            expect(module).to.eventually.have.property('default_permission', ''),
            expect(module).to.eventually.have.property('canAddNewPrefs', true),
            expect(module).to.eventually.have.property('prefs').and.deep.equal(['testpref']),
            expect(module).to.eventually.have.property('newPrefsTemplate').and.deep.equal(['testpreftemplate'])
        ]);
    });
});
