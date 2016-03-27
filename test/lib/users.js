'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const nedb = require('nedb');
const bluebird = require('bluebird');
const sinon = require('sinon');
const mockery = require('mockery');

const testUsersDb = bluebird.promisifyAll(new nedb({ filename: 'testUsers.db', autoload: true, inMemoryOnly: true}));

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('Users', function() {
    let users;
    let cryptoCalled = 0;
    before(function(done) {
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false,
            useCleanCache: true
        });

        mockery.registerMock('crypto', {
            randomBytes: () => {
                return {
                    toString: () => {
                        return {
                            slice: () => {
                                if (cryptoCalled === 0) {
                                    cryptoCalled++;
                                    return '1234';
                                }

                                return '2345';
                            }
                        };
                    }
                };
            }
        });

        testUsersDb.insertAsync({
            username: 'admin',
            accounts: {
                'shell':'shelladmin'
            },
            role:'admin',
            defaultAccount:'shell'
        }).then(() => {
            return testUsersDb.insertAsync({
                username: 'luke',
                accounts: {
                    'testInterface':'luke',
                    'testInterface2': 'lukeb'
                },
                role:'admin',
                defaultAccount:'testInterface'
            });
        }).then(() => {
            const usersClass = require('../../lib/users.js');
            users = new usersClass(testUsersDb);
            done();
        });
    });

    beforeEach(function() {
        users.pendingAccounts = {};
        cryptoCalled = 0;
    });

    it('userFromAccount returns the correct user', function() {
        const user = users.userFromAccount('shelladmin', 'shell');

        return expect(user).to.eventually.have.property('username', 'admin');
    });

    it('userFromAccount should error if account not registered to user', function() {
        const user = users.userFromAccount('lukeb', 'slack');

        return expect(user).to.be.rejectedWith(Error, 'This slack account is not registered with any username');
    });

    it('getDefaultAccount returns the correct user', function() {
        const user = users.getDefaultAccount('admin');

        return expect(user).to.eventually.deep.equal({interface: 'shell', account: 'shelladmin'});
    });

    it('getDefaultAccount should error if username does not exist', function() {
        const user = users.getDefaultAccount('fake');

        return expect(user).to.be.rejectedWith(Error, 'The username fake does not exist');
    });

    it('register should successfully add a user', function() {
        const user = users.register('testUser', 'testAccount', 'testInterface');

        return bluebird.all([
            expect(user).to.eventually.have.property('username', 'testUser'),
            expect(user).to.eventually.have.property('accounts'),
            expect(user).to.eventually.have.deep.property('accounts.testInterface', 'testAccount'),
            expect(user).to.eventually.have.property('role', 'standard'),
            expect(user).to.eventually.have.property('defaultAccount', 'testInterface')
        ]);
    });

    it('register sould error if username already exists', function() {
        const user = users.register('admin', 'shelladmin', 'shell');

        return expect(user).to.be.rejectedWith(Error, 'The username admin already exists');
    });

    it('register sould error if account already registered with another username', function() {
        const user = users.register('dupetest', 'shelladmin', 'shell');

        return expect(user).to.be.rejectedWith(Error, 'This shell account is already registered with another username');
    });

    it('addAccount should add an account to the pending users object', function() {
        const user = users.addAccount('admin', 'testInterfaceAdmin', 'testInterface');

        return user.then((code) => {
            return expect(users.pendingAccounts[code]).to.deep.equal({
                username: 'admin',
                accountName: 'testInterfaceAdmin',
                interfaceName: 'testInterface'
            });
        });
    });

    it('addAccount should remove the entry from to the pending users object after 60 seconds', function() {
        const clock = sinon.useFakeTimers();
        const user = users.addAccount('admin', 'testInterfaceAdmin2', 'testInterface2');
        clock.tick(60100);
        clock.restore();
        return user.then((code) => {
            return expect(users.pendingAccounts).to.not.have.property(code);
        });
    });

    it('addAccount should error if the account is already registered with to you', function() {
        const user = users.addAccount('admin', 'shelladmin', 'shell');

        return expect(user).to.be.rejectedWith(Error, 'This shell account is already registered to you');
    });

    it('addAccount should error if the account is already registered with another username', function() {
        const user = users.addAccount('luke', 'shelladmin', 'shell');

        return expect(user).to.be.rejectedWith(Error, 'This shell account is already registered with another username');
    });

    it('addAccount should error if the username does not exist', function() {
        const user = users.addAccount('fake', 'fake', 'fake');

        return expect(user).to.be.rejectedWith(Error, 'The username fake does not exist');
    });

    it('addAccount should error if the username already has an account of the same type', function() {
        const user = users.addAccount('admin', 'shelltest', 'shell');

        return expect(user).to.be.rejectedWith(Error, 'The username admin already has a shell account associated with it');
    });

    it('createPendingAccount should regenerate key if it already exists', function() {
        users.pendingAccounts[1234] = {};
        const user = users.addAccount('admin', 'testInterfaceAdmin3', 'testInterface3');

        return user.then(() => {
            return expect(users.pendingAccounts).to.have.property(2345);
        });
    });

    it('verify should error if the code is not in the pendingAccounts object', function() {
        const user = users.verify(1234, 'testInterfaceAdmin', 'testInterface');

        return expect(user).to.be.rejectedWith(Error, 'The code 1234 is either invalid or has timed out');
    });

    it('verify should error if the account names do not match', function() {
        users.pendingAccounts[1234] = {
            accountName: 'wrong'
        };
        const user = users.verify(1234, 'testInterfaceAdmin', 'testInterface');

        return expect(user).to.be.rejectedWith(Error, 'The code 1234 is either invalid or has timed out');
    });

    it('verify should error if the interface names do not match', function() {
        users.pendingAccounts[1234] = {
            accountName: 'testInterfaceAdmin',
            interfaceName: 'wrong'
        };
        const user = users.verify(1234, 'testInterfaceAdmin', 'testInterface');

        return expect(user).to.be.rejectedWith(Error, 'The code 1234 is either invalid or has timed out');
    });

    it('verify should add the account to the user and remove it from the pendingAccounts object', function() {
        users.pendingAccounts[1234] = {
            username: 'admin',
            accountName: 'testInterfaceAdmin',
            interfaceName: 'testInterface'
        };
        const user = users.verify(1234, 'testInterfaceAdmin', 'testInterface');

        return user.then(() => {
            return bluebird.all([
                expect(users.pendingAccounts).to.not.have.property('1234'),
                expect(testUsersDb.findOneAsync({username: 'admin'})).to.eventually.have.deep.property('accounts.testInterface', 'testInterfaceAdmin'),
            ]);
        })
    });

    it('changeDefaultAccount should error if the user does not exist', function() {
        const user = users.changeDefaultAccount('fake', 'testInterface2');

        return expect(user).to.be.rejectedWith(Error, 'The username fake does not exist');
    });

    it('changeDefaultAccount should error if the user does not have an account of that type', function() {
        const user = users.changeDefaultAccount('luke', 'fakeInterface');

        return expect(user).to.be.rejectedWith(Error, 'luke does not have a fakeInterface account associated with it');
    });

    it('changeDefaultAccount should successfully change default account', function() {
        const user = users.changeDefaultAccount('luke', 'testInterface2');

        return user.then(() => {
            return expect(testUsersDb.findOneAsync({username: 'luke'})).to.eventually.have.property('defaultAccount', 'testInterface2');
        })
    });

    it('rename should error if the user does not exist', function() {
        const user = users.rename('fake', 'lukeb');

        return expect(user).to.be.rejectedWith(Error, 'The username fake does not exist');
    });

    it('rename should error if the new username already exists', function() {
        const user = users.rename('luke', 'admin');

        return expect(user).to.be.rejectedWith(Error, 'The username admin already exists');
    });

    it('rename should successfully rename the user', function() {
        return testUsersDb.findOneAsync({username: 'lukeb'}).then((user) => {
            const renamedUser = users.rename('luke', 'lukeb');

            return renamedUser.then(() => {
                return bluebird.all([
                    expect(user).to.be.null,
                    expect(testUsersDb.findOneAsync({username: 'lukeb'})).to.eventually.not.be.null,
                    expect(testUsersDb.findOneAsync({username: 'luke'})).to.eventually.be.null
                ]);
            });
        });
    });

    it('remove should error if the username does not exist', function() {
        const user = users.remove('fake');

        return expect(user).to.be.rejectedWith(Error, 'The username fake does not exist');
    });

    it('remove should error if the username does not exist', function() {
        return testUsersDb.findOneAsync({username: 'admin'}).then((user) => {
            return users.remove('admin').then(() => {
                return bluebird.all([
                    expect(user).to.not.be.null,
                    expect(testUsersDb.findOneAsync({username: 'admin'})).to.eventually.be.null
                ]);
            });
        });
    });
});
