const moment = require('moment-timezone');

class time {
    constructor() {
        this.name = 'time';
        this.displayname = 'Time';
        this.description = 'Get the time'
    }

    init() {
        this.listen(
            'time',
            'what time is it(\\?|)',
            'standard',
            () => {
                return this.getSystemPref('timezone').then((timezone) => {
                    const currentTime = moment().tz(timezone).format('h:mmA');

                    return `The time is ${currentTime}`;
                })
            }
        );
    }
}

module.exports = time;
