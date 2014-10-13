var should = require('should');
var api = require("../../lib/api.js")
var instance;

describe('Api', function(){
    beforeEach(function(){
        instance = new api({
            name: "Test name"
        });
    })
    it('must expose a name', function(){
        instance.name.should.equal("Test name");
    });

    it('must expose the listen function', function(){
        instance.listen.should.be.a.Function;

        instance.listen('testmodule', 'testlistener', 'testrole', 'testcommand');
        instance.listeners.testmoduletestlistener.should.have.properties({
            module: 'testmodule',
            listener: 'testlistener',
            role: 'testrole',
            command: 'testcommand'
        });
    });

    it('must expose the addMessageSender function', function(){
        instance.addMessageSender.should.be.a.Function;

        instance.addMessageSender('testsender', 'testcommand');
        instance.messageSenders.testsender.should.equal('testcommand');
    });

    it('checkrole must be true if the role is below yours', function(){
        instance.checkRole.should.be.a.Function;

        var returnVal = instance.checkRole('admin', 'ignore');

        returnVal.should.be.true;
    });

    it('checkrole must be false if the role is above yours', function(){
        instance.checkRole.should.be.a.Function;

        var returnVal = instance.checkRole('ignore', 'admin');

        returnVal.should.be.false;
    });

    it('sendMessage must call the correct function', function(){
        instance.sendMessage.should.be.a.Function;

        var called = false;
        instance.messageSenders['testinterface'] = function(message, to){
            message.should.equal('testmessage');
            to.should.equal('testto');
            called = true;
        }

        instance.sendMessage('testmessage', 'testinterface', 'testto');
        called.should.be.true;
    })
})
