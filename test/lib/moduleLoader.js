'use strict';

const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
const mockery = require('mockery');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('Module Loader', function() {
    let moduleLoader;
    before(function() {
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false,
            useCleanCache: true
        });

        mockery.registerMock('fs', {
            readdir() {
                return [
                    'folder1',
                    'folder2',
                    'file1'
                ]
            },
            stat(file) {
                return {
                    isDirectory(){
                        return file === 'file1';
                    }
                }
            }
        });

        const moduleLoaderClass = require("../../lib/moduleLoader.js");
        moduleLoader = new moduleLoaderClass({}, {});
    });

    it('getmodulelist should only return folders', function() {
        const moduleList = moduleLoader.getModuleList('test');

        expect(moduleList).to.eventually.have.lengthOf(2);
        expect(moduleList).to.eventually.not.contain('file1');
    })
});
