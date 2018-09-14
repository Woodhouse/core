'use strict';

const crypto = require('crypto');

function generateId(length, takenIds = []) {
    const id = crypto.randomBytes(4).toString('hex').slice(0, 4);

    if (takenIds.indexOf(id) > -1) {
        return generateId(length, takenIds);
    }

    return id;
}

module.exports = {
    generateId
}
