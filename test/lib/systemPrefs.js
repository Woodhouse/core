'use strict';

const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
const nedb = require('nedb');
const bluebird = require('bluebird');

const testSystemPrefsDb = bluebird.promisifyAll(new nedb({ filename: 'testSystemPrefs.db', autoload: true, inMemoryOnly: true}));

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('System Preferences', function() {
    let systemPrefs;
    before(function(done) {
        testSystemPrefsDb.insertAsync({
            name: "port",
            type: "text",
            value: "8080"
        }).then(() => {
            return testSystemPrefsDb.insertAsync({
                name: "default_permission",
                type: "text",
                value: "standard"
            });
        }).then(() => {
            return testSystemPrefsDb.insertAsync({
                name: "falsy",
                type: "checkbox",
                value: false
            });
        }).then(() => {
            const systemPrefsClass = require("../../lib/systemPrefs.js");
            systemPrefs = new systemPrefsClass(testSystemPrefsDb);
            done();
        });
    });

    it('get returns the correct value', function() {
        const enabled = systemPrefs.get('port');

        return expect(enabled).to.eventually.equal('8080');
    });

    it('get returns a falsy value where relevant', function() {
        const enabled = systemPrefs.get('falsy');

        return expect(enabled).to.eventually.be.false;
    });

    it('get throws an exception if pref key not found', function() {
        const enabled = systemPrefs.get('fake');

        return expect(enabled).to.be.rejectedWith(Error, 'System pref fake not found');
    });
});
