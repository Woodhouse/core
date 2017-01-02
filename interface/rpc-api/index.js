`use strict`;

const bluebird = require(`bluebird`);
const https = require(`https`);
const crypto = bluebird.promisifyAll(require(`crypto`));
const path = require(`path`);
const nedb = require(`nedb`);
const fs = bluebird.promisifyAll(require(`fs`));
const clients = bluebird.promisifyAll(new nedb({ filename: path.join(__dirname, `clients.db`), autoload: true }));


class Api {
    constructor() {
        this.name = `rpc-api`;
        this.displayname = `RPC API`;
        this.description = `Issue commands through an API`;
        this.defaultPrefs = {
            port: {displayname: `Port`, value: `8443`, type: `text`}
        };
    }

    init() {
        this.listen(`api add client (:<name>.+?)`, `admin`, (from, interfaceName, [name]) => {
            return clients.findAsync({name}).then((docs) => {
                if (docs.length > 0) {
                    return bluebird.reject(`A client with that name already exists, please choose another.`);
                }

                return crypto.randomBytesAsync(32);
            }).then((key) => {
                key = key.toString('base64');
                return clients.insertAsync({name, key});
            }).then((doc) => {

                return bluebird.resolve(`Client ${name} has been added. The key is ${doc.key}`);
            });
        });

        this.listen(`api remove client (:<name>.+?)`, `admin`, (from, interfaceName, [name]) => {
            return clients.findAsync({name}).then((docs) => {
                if (docs.length === 0) {
                    return bluebird.reject(`A client with that name does not exist, please choose another.`);
                }

                return clients.removeAsync({name});
            }).then((doc) => {

                return bluebird.resolve(`Client ${name} has been removed`);
            });
        });

        this.listen(`api list clients`, `admin`, (from, interfaceName) => {
            return clients.findAsync({}).then((docs) => {
                if (docs.length === 0) {
                    return bluebird.reject(`There are no api clients`);
                }

                return bluebird.reduce(docs, (message, client) => {
                    return `${message}\n${client.name}`.trim();
                }, ``);
            });
        });

        this.listen(`api client key (:<name>.+?)`, `admin`, (from, interfaceName, [name]) => {
            return clients.findOneAsync({name}).then((doc) => {
                if (!doc) {
                    return bluebird.reject(`A client with that name does not exist, please choose another.`);
                }

                return bluebird.resolve(`The key for client ${name} is ${doc.key}`);
            });
        });

        bluebird.all([
            this.getPref(`port`),
            fs.readFileAsync(path.join(__dirname, `certs`, `server`, `server.key.pem`)),
            fs.readFileAsync(path.join(__dirname, `certs`, `ca`, `root-ca.crt.pem`)),
            fs.readFileAsync(path.join(__dirname, `certs`, `server`, `server.crt.pem`))
        ]).then(([port, key, ca, cert]) => {
            const server = https.createServer({
                key,
                ca: [ca],
                cert,
                requestCert: true,
                rejectUnauthorized: true
            }, (request, response) => {
                clients.findOneAsync({key: request.headers[`x-auth-key`]}).then((doc) => {
                    if (!doc) {
                        response.statusCode = 401;
                        response.end(`This auth key is invalid`);
                    }

                    if (request.method !== `POST`) {
                        response.end(`RPC-API Usage: POST to this endpoint with a full command as the body, including the instance name, e.g 'woodhouse say hello'.`);
                    }

                    let body = ``;

                    request.on(`data`, (chunk) => {
                        body += chunk;
                    });
                    request.on(`end`, () => {
                        this.messageRecieved(`api-user`, body).then((message) => {
                            response.end(message)
                        });
                    });
                });
            });
server.on('clientError', (err, socket) => {
    console.log(err)
});
            server.listen(port);
        });
    }
}

module.exports = Api;
