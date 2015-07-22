var promise = require('bluebird'),
    nedb = require('nedb'),
    cronJob = require('cron').CronJob,
    cronData = promise.promisifyAll(new nedb({ filename: './cron.db', autoload: true })),
    cron = function() {
        cronData.findAsync({}).then(function(tasks) {
            tasks.forEach(function(item) {
                var crontime = parseInt(item.crontime, 10),
                    callback = function() {
                        this.cronCallback(item.handlerName, JSON.parse(item.params));
                    }.bind(this);

                if (!isNaN(crontime) && crontime < Date.now()) {
                    cronData.removeAsync({_id: item._id});
                }else {
                    if (!isNaN(crontime)) {
                        item.crontime = new Date(crontime);
                    }

                    this.cronTasks.push(new cronJob(item.crontime, callback, null, true));
                }
            }.bind(this));
        }.bind(this));

        this.cronTasks = [];
        this.cronHandlers = {};
    };

cron.prototype.registerHandler =  function(moduleName, handlerName, callback) {
    this.cronHandlers[moduleName + handlerName] = callback;
}

cron.prototype.addJob = function(moduleName, crontime, handlerName, params) {
    var callback = function() {
        this.cronCallback(moduleName + handlerName, params);
    }.bind(this);

    this.cronTasks.push(new cronJob(crontime, callback, null, true));

    cronData.insert({
        handlerName: moduleName + handlerName,
        crontime: typeof crontime === 'object' ? crontime.getTime() : crontime,
        params: JSON.stringify(params)
    });

    return this.cronTasks.length - 1;
}

cron.prototype.removeJob = function(id){
    if (this.cronTasks[id]) {
        this.cronTasks[id].stop();
    }
}

cron.prototype.cronCallback = function(handlerName, params) {
    try {
        this.cronHandlers[handlerName](params);
    } catch (e) {
        console.log('Couldn\'t call cron handler ' + handlerName + '. Error given: ' + e.message);
    }
}

module.exports = cron;
