'use strict';

const cronJob = require('cron').CronJob;
const util = require('./util');
const promise = require('bluebird');

class cron {
    constructor(cronData) {
        this.cronData = cronData;
        this.cronTasks = {};
        this.cronHandlers = {};
    }

    loadSaved() {
        return this.cronData.findAsync({}).then((tasks) => {
            tasks.forEach((task) => {
                let crontime = parseInt(task.crontime, 10);

                task.crontime = new Date(crontime);

                if (crontime < Date.now()) {
                    this.cronData.removeAsync({_id: task._id});
                } else {
                    this.cronTasks[task._id] = new cronJob(
                        task.crontime,
                        () => {
                            this.cronCallback(task.moduleName, task.handlerName, JSON.parse(task.params));
                            onComplete();
                        },
                        () => {
                            delete this.cronTasks[id];
                            this.cronData.removeAsync({_id: id});
                        },
                        true
                    );
                }
            });
        });
    }

    add(moduleName, crontime, handlerName, params) {
        const id = util.generateId(4, Object.keys(this.cronTasks));

        this.cronTasks[id] = new cronJob(
            crontime,
            (onComplete) => {
                this.cronCallback(moduleName, handlerName, params);
                onComplete();
            },
            () => {
                delete this.cronTasks[id];
                this.cronData.removeAsync({_id: id});
            },
            true
        );

        return this.cronData.insertAsync({
            _id: id,
            moduleName: moduleName,
            handlerName: handlerName,
            crontime: typeof crontime === 'object' ? crontime.getTime() : crontime,
            params: JSON.stringify(params)
        }).then(() => {
            return id;
        });

    }

    remove(id) {
        if (this.cronTasks[id]) {
            this.cronTasks[id].stop();
            delete this.cronTasks[id];
            return this.cronData.removeAsync({_id: id});
        }

        return promise.reject('No cron with ID ' + id);
    }

    registerHandler(moduleName, handlerName, callback) {
        this.cronHandlers[moduleName + handlerName] = callback;
    }

    cronCallback(moduleName, handlerName, params) {
        try {
            this.cronHandlers[moduleName + handlerName](params);
        } catch (e) {
            console.log('Couldn\'t call cron handler ' + handlerName + '. Error given: ' + e.message);
        }
    }
}

module.exports = cron;
