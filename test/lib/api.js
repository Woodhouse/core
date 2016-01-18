var api = require("../../lib/api.js"),
    expect = require('chai').expect,
    yesNo = require('../../lib/modules/yesno.js'),
    cron = require('../../lib/modules/cron.js'),
    user = require('../../lib/modules/user.js'),
    instance;

describe('Api', function(){
    beforeEach(function(){
        instance = new api({
            name: "Test name",
            interfacePrefs: 'interfaceFoo',
            pluginPrefs: 'pluginFoo',
            basePrefs: 'baseFoo'
        });
    });

    it('should expose a name', function(){
        expect(instance.name).to.be.equal('Test name');
    });

    it('should expose the preference databases', function() {
        expect(instance.prefs).to.be.an('object');
        expect(instance.prefs.interfaces).to.be.equal('interfaceFoo');
        expect(instance.prefs.plugins).to.be.equal('pluginFoo');
        expect(instance.prefs.base).to.be.equal('baseFoo');

    });

    it('should expose the listen function and should add listeners to the listeners object', function(){
        expect(instance.listen).to.be.a('Function');

        instance.listen({name:'testmodule', displayname: 'TestModule'}, 'testlistener', 'testrole', 'testcommand');

        expect(instance.listeners).to.be.an('object');

        expect(instance.listeners).to.have.property('testmoduletestlistener');

        expect(instance.listeners.testmoduletestlistener).to.have.property('module');

        expect(instance.listeners.testmoduletestlistener.module).to.be.an('object');
        expect(instance.listeners.testmoduletestlistener.module).to.have.property('name', 'testmodule');
        expect(instance.listeners.testmoduletestlistener.module).to.have.property('displayname', 'TestModule');

        expect(instance.listeners.testmoduletestlistener).to.have.property('listener', 'testlistener');
        expect(instance.listeners.testmoduletestlistener).to.have.property('role', 'testrole');
        expect(instance.listeners.testmoduletestlistener).to.have.property('command', 'testcommand');
    });

    it('should expose the addMessageSender function and it should add senders to the senders object', function(){
        expect(instance.addMessageSender).to.be.a('Function');

        instance.addMessageSender('testsender', 'testcommand');

        expect(instance.messageSenders).to.be.an('object');

        expect(instance.messageSenders).to.have.property('testsender');

        expect(instance.messageSenders.testsender).to.be.equal('testcommand');
    });

    it('checkrole should return true if the role is below yours', function(){
        expect(instance.checkRole).to.be.a('Function');

        expect(instance.checkRole('admin', 'ignore')).to.be.true;
    });

    it('checkrole should return false if the role is above yours', function(){
        expect(instance.checkRole).to.be.a('Function');

        expect(instance.checkRole('ignore', 'admin')).to.be.false;
    });

    it('sendMessage should call the correct function', function(){
        var called = false;

        expect(instance.sendMessage).to.be.a('Function');

        instance.addMessageSender('testinterface', function(message, to){
            expect(message).to.equal('testmessage');
            expect(to).to.equal('testto');
            called = true;
        });

        instance.sendMessage('testmessage', 'testinterface', 'testto');
        expect(called).to.be.true;
    });

    it('should expose the yesno module', function() {
        expect(instance.yesNo).to.be.an.instanceOf(yesNo);
    });


    it('should expose the cron module', function() {
        expect(instance.cron).to.be.an.instanceOf(cron);
    });


    it('should expose the user module', function() {
        expect(instance.user).to.be.an.instanceOf(user);
    });
})
