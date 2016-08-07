'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const mockery = require('mockery');
const bluebird = require('bluebird');
const moment = require('moment');
const sinon = require('sinon');
const nedb = require('nedb');
const cronJob = require('cron').CronJob;
const cronClass = require('../../lib/cron.js');


chai.use(chaiAsPromised);

const expect = chai.expect;

describe('Cron', function() {
    let cron;
    let testCronDb;
    let clock;

    beforeEach(function(done) {
        testCronDb = bluebird.promisifyAll(new nedb({ filename: 'testCron.db', autoload: true, inMemoryOnly: true}));
        cron = new cronClass(testCronDb);
        let crontime = moment().add(1, 'year').toDate();

        cron.registerHandler('testmodule', 'testhandler', function() {});

        done();
    });

    it('add should add the cron job to the crontasks array and the database', function(done) {
        const crontime = moment().add(1, 'year').toDate();

        return cron.add('testmodule', crontime, 'testhandler', {test: 'test'}).then((id) => {
            return testCronDb.findOneAsync({_id: id}).then((doc) => {
                expect(Object.keys(cron.cronTasks)).to.have.length(1);
                expect(cron.cronTasks[id].cronTime.source.toDate().getTime()).to.equal(crontime.getTime());
                expect(doc).to.have.property('crontime', crontime.getTime());
                done();
            });
        });
    });

    it('add should remove the cron job to the crontasks array and the database once run', function(done) {
        const crontime = moment().add(10, 'milliseconds').toDate();

        return cron.add('testmodule', crontime, 'testhandler', {test: 'test'}).delay(15).then((id) => {
            return testCronDb.findOneAsync({_id: id}).then((doc) => {
                expect(Object.keys(cron.cronTasks)).to.have.length(0);
                expect(doc).to.be.null;
                done();
            });
        });
    });

    it('remove should remove the cron job to the crontasks array and the database', function(done) {
        const crontime = moment().add(1, 'year').toDate();

        testCronDb.insertAsync({
            _id: 'abcd',
            moduleName: 'testModule',
            handlerName: 'testHandler',
            crontime: crontime.getTime(),
            params: '{}'
        }).then(() => {
            cron.cronTasks['abcd'] = new cronJob(
                crontime,
                () => {},
                () => {},
                true
            );

            cron.remove('abcd').then(() => {
                testCronDb.findOneAsync({_id: 'abcd'}).then((doc) => {
                    expect(Object.keys(cron.cronTasks)).to.have.length(0);
                    expect(doc).to.be.null;
                    done();
                });
            });
        });

    });

    it('remove should throw if you try to remove something that doesn\'t exist', function(done) {
        const crontime = moment().add(1, 'year').toDate();

        testCronDb.insertAsync({
            _id: 'abcd',
            moduleName: 'testModule',
            handlerName: 'testHandler',
            crontime: crontime.getTime(),
            params: '{}'
        }).then(() => {
            cron.cronTasks['abcd'] = new cronJob(
                crontime,
                () => {},
                () => {},
                true
            );

            const remove = cron.remove('wxyz');

            expect(remove).to.be.rejectedWith('No cron with ID wxyz');

            remove.catch(() => {
                expect(Object.keys(cron.cronTasks)).to.have.length(1);
                done();
            });
        });
    });

    it('loadSaved should load the cron jobs from the database', function(done) {
        const crontime = moment().add(1, 'day').toDate();

        expect(Object.keys(cron.cronTasks)).to.have.length(0);

        testCronDb.insertAsync({
            _id: 'abcd',
            moduleName: 'testModule',
            handlerName: 'testHandler',
            crontime: crontime.getTime(),
            params: '{"test": "test"}'
        }).then(() => {
            return cron.loadSaved();
        }).then(() => {
            expect(Object.keys(cron.cronTasks)).to.have.length(1);
            expect(cron.cronTasks['abcd'].cronTime.source.toDate().getTime()).to.equal(crontime.getTime());
            done();
        });
    });

    it('loadSaved should remove old cron jobs from the database', function(done) {
        const crontime = moment().subtract(1, 'day').toDate();

        expect(Object.keys(cron.cronTasks)).to.have.length(0);

        testCronDb.insertAsync({
            _id: 'abcd',
            moduleName: 'testModule',
            handlerName: 'testHandler',
            crontime: crontime.getTime(),
            params: '{"test": "test"}'
        }).then(() => {
            return cron.loadSaved();
        }).then(() => {
            expect(Object.keys(cron.cronTasks)).to.have.length(0);
            return testCronDb.findOneAsync({_id: 'abcd'});
        }).then((doc) => {
            expect(doc).to.be.null;
            done();
        });
    });
});
