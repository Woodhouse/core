'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const mockery = require('mockery');
const bluebird = require('bluebird');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('Dispatcher', function() {
    let dispatcher;

    const mockUsers = {
        userFromAccount: (interfaceUser, interfaceName) => {
            if (interfaceUser === 'messageRecieved1user') {
                return {
                    role: 'admin'
                };
            } else if (interfaceUser === 'messageRecieved2') {
                return {
                    role: 'admin'
                };
            } else if (interfaceUser === 'messageRecieved3') {
                return null;
            } else if (interfaceUser === 'messageRecieved4') {
                return null;
            } else if (interfaceUser === 'messageRecieved5') {
                return {
                    role: 'ignore'
                };
            }
        }
    };

    const mockModuleData = {
        getPref: () => {
            return 'getPref';
        },
        get: (type, name, key) => {
            if (name === 'testInterface1' && key === 'default_permission') {
                return bluebird.resolve('trusted');
            } else if (name === 'testInterface2' && key === 'default_permission') {
                return bluebird.resolve('');
            } else if (name === 'loadListenerAliases1' && key === 'listeneraliases') {
                return bluebird.resolve([{
                  "id": "loadListenerAliases1hello (:<name>.+?)(\!|)",
                  "listener": "hello <<name>>",
                  "alias": "<<name>>, hello"
                }]);
            } else if (name === 'loadListenerAliases2' && key === 'listeneraliases') {
                return bluebird.resolve([{
                  "id": "loadListenerAliases2good day (:<name>.+?)(\!|)",
                  "listener": "good day <<name>>",
                  "alias": "<<name>>, sup"
                }]);
            }
        },
        addModule: () => {
            return bluebird.resolve();
        }
    };

    const mockSystemPrefs = {
        get: (key) => {
            if (key === 'name') {
                return bluebird.resolve('woodhouse');
            } else if (key === 'default_permission') {
                return 'standard';
            }
        }
    };

    beforeEach(function() {
        const dispatcherClass = require('../../lib/dispatcher.js');
        dispatcher = new dispatcherClass(mockUsers, mockModuleData, mockSystemPrefs);
    });

    it('addMessageSender adds the sender to the messageSenders object', function() {
        const sender = () => {
            return 'sender';
        };

        dispatcher.addMessageSender('test', sender);

        return expect(dispatcher.messageSenders).to.have.property('test', sender);
    });

    it('messageRecieved should call the callback', function() {
        let success = false;
        dispatcher.listeners['testModuletest'] = {
            listener: 'test',
            role: 'admin',
            command: () => {
                success = true;
            }
        };

        return dispatcher.messageRecieved('testInterface', 'messageRecieved1', 'woodhouse test', 'messageRecieved1user').then(() => {
            return expect(success).to.be.true;
        })

    });

    it('messageRecieved should work when interfaceuser is not defined', function() {
        let success = false;
        dispatcher.listeners['testModuletest'] = {
            listener: 'test',
            role: 'admin',
            command: () => {
                success = true;
            }
        };

        return dispatcher.messageRecieved('testInterface', 'messageRecieved2', 'woodhouse test').then(() => {
            return expect(success).to.be.true;
        })

    });

    it('messageRecieved should fall back to interface default permission if user does not have a role', function() {
        let success = false;
        dispatcher.listeners['testModuletest'] = {
            listener: 'test',
            role: 'trusted',
            command: () => {
                success = true;
            }
        };

        return dispatcher.messageRecieved('testInterface1', 'messageRecieved3', 'woodhouse test').then(() => {
            return expect(success).to.be.true;
        })

    });

    it('messageRecieved should fall back to system default permission if interface does not have a default permission', function() {
        let success = false;
        dispatcher.listeners['testModuletest'] = {
            listener: 'test',
            role: 'standard',
            command: () => {
                success = true;
            }
        };

        return dispatcher.messageRecieved('testInterface2', 'messageRecieved4', 'woodhouse test').then(() => {
            return expect(success).to.be.true;
        })
    });

    it('messageRecieved should not execute the callback if the user does not have permission', function() {
        let success = false;
        dispatcher.listeners['testModuletest'] = {
            listener: 'test',
            role: 'standard',
            command: () => {
                success = true;
            }
        };

        return dispatcher.messageRecieved('testInterface', 'messageRecieved5', 'woodhouse test').then(() => {
            return expect(success).to.be.false;
        })
    });

    it('listen should add the listener to the listeners object', function() {
        dispatcher.listen({name:'testModule', displayname: 'Test Module'}, 'hello (:<name>.+?)', 'standard', 'testcommand', true);

        expect(dispatcher.listeners).to.have.property('testModulehello <<name>>');
        expect(dispatcher.listeners).to.have.deep.property('testModulehello <<name>>.module');
        expect(dispatcher.listeners).to.have.deep.property('testModulehello <<name>>.module.name', 'testModule');
        expect(dispatcher.listeners).to.have.deep.property('testModulehello <<name>>.module.displayname', 'Test Module');
        expect(dispatcher.listeners).to.have.deep.property('testModulehello <<name>>.listener', 'hello (:<name>.+?)');
        expect(dispatcher.listeners).to.have.deep.property('testModulehello <<name>>.role', 'standard');
        expect(dispatcher.listeners).to.have.deep.property('testModulehello <<name>>.command', 'testcommand');
        expect(dispatcher.listeners).to.have.deep.property('testModulehello <<name>>.isAlias', true);
    });

    it('listen should set isAlias to false if it is not set', function() {
        dispatcher.listen({name:'testModule', displayname: 'Test Module'}, '(hello|hi)', 'standard', 'testcommand');

        expect(dispatcher.listeners).to.have.property('testModule(hello|hi)');
        expect(dispatcher.listeners).to.have.deep.property('testModule(hello|hi).isAlias', false);
    });

    it('sendMessage should call the messageSender if it exists', function() {
        dispatcher.messageSenders['testInterface'] = (to, message) => {
            expect(to).to.equal('testTo');
            expect(message).to.equal('testMessage');
        }

        dispatcher.sendMessage('testTo', 'testInterface', 'testMessage');
    });

    it('sendMessage should not call the messageSender if it does not exist', function() {
        let called = false
        dispatcher.messageSenders['testInterface'] = () => {
            called = true;
        }

        dispatcher.sendMessage('fake', 'fake', 'fake');
        expect(called).to.be.false;
    });

    it('loadListenerAliases should add the alias to the listeners object', function() {
        let success = false;
        dispatcher.listeners['loadListenerAliases1hello <<name>>'] = {
            listener: 'hello (:<name>+?)(\!|)',
            role: 'admin',
            command: () => {
                success = true;
            }
        }
        return dispatcher.loadListenerAliases({name: 'loadListenerAliases1'}).then(() => {
            expect(dispatcher.listeners).to.have.property('loadListenerAliases1<<name>>, hello');

            dispatcher.listeners['loadListenerAliases1<<name>>, hello'].command('user', 'interface1', ['jeff']);
            return expect(success).to.be.true;
        })
    });

    it('loadListenerAliases should add the alias to the listeners object', function() {
        return dispatcher.loadListenerAliases({name: 'loadListenerAliases2'}).then(() => {
            expect(dispatcher.listeners).to.not.have.property('loadListenerAliases2<<name>>, sup');
        })
    });

    it('checkrole should return true if the user role is higher than the action role', function() {
        expect(dispatcher.checkRole('admin', 'standard')).to.be.true;
    });

    it('checkrole should return true if the user role is the same as the action role', function() {
        expect(dispatcher.checkRole('standard', 'standard')).to.be.true;
    });

    it('checkrole should return false if the user role is lower than the action role', function() {
        expect(dispatcher.checkRole('standard', 'admin')).to.be.false;
    });

})
