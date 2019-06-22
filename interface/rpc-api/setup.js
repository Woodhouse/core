'use strict';

const bluebird = require(`bluebird`);
const nedb = require(`nedb`);
const crypto = require(`crypto`);
const args = process.argv.slice(2);
const path = require(`path`);
const fs = bluebird.promisifyAll(require(`fs`));
const exec = bluebird.promisify(require('child_process').exec);

const interfacePrefData = bluebird.promisifyAll(new nedb({ filename: path.join(__dirname, `../`, `../`, `interface-prefs.db`), autoload: true }));
const basePrefData = bluebird.promisifyAll(new nedb({ filename: path.join(__dirname, `../`, `../`, `base-prefs.db`), autoload: true }));
const clients = bluebird.promisifyAll(new nedb({ filename: path.join(__dirname, `clients.db`), autoload: true }));

let domain;
let clientDoc;

const argVal = (key) => {
    const thisArg = args.filter((el) => {
        return !!el.match(`--${key}(=.+?|)$`);
    });

    if (thisArg.length === 0) {
        return false;
    }
    const returnVal = thisArg[0].split('=');

    return returnVal.length > 1 ? returnVal[1] : true;
}

let execPromise = interfacePrefData.findOneAsync({name: `rpc-api`}).then((doc) => {
    domain = doc.prefs.domain.value;
});

if (
    argVal(`server`) ||
    argVal(`all`)
) {
    execPromise = execPromise.then(() => {
        return fs.mkdirAsync(path.join(__dirname, `certs`));
    }).then(() => {
          return fs.mkdirAsync(path.join(__dirname, `certs`, `ca`));
    }).then(() => {
          return fs.mkdirAsync(path.join(__dirname, `certs`, `tmp`));
    }).then(() => {
        return exec(`openssl genrsa \\
            -out ${path.join(__dirname, `certs`, `ca`, `root-ca.key.pem`)} \\
            2048`);
    }).then(() => {
        return exec(`openssl req \\
            -x509 \\
            -new \\
            -nodes \\
            -key ${path.join(__dirname, `certs`, `ca`, `root-ca.key.pem`)} \\
            -days 3652 \\
            -out ${path.join(__dirname, `certs`, `ca`, `root-ca.crt.pem`)} \\
            -subj "/C=GB/ST=London/L=London/O=Woodhouse Signing Authority/CN=${domain}"`);
    }).then(() => {
        return fs.mkdirAsync(path.join(__dirname, `certs`, `server`));
    }).then(() => {
        return exec(`openssl genrsa \\
            -out ${path.join(__dirname, `certs`, `server`, `server.key.pem`)} \\
            2048`);
    }).then(() => {
        return basePrefData.findOneAsync({name: `id`});
    }).then((doc) => {
        return exec(`openssl req -new \\
            -key ${path.join(__dirname, `certs`, `server`, `server.key.pem`)} \\
            -out ${path.join(__dirname, `certs`, `tmp`, `server.csr.pem`)} \\
            -subj "/C=GB/ST=London/L=London/O=Woodhouse Instance/CN=${doc.value}.${domain}"`);
    }).then(() => {
        return exec(`openssl x509 \\
            -req -in ${path.join(__dirname, `certs`, `tmp`, `server.csr.pem`)} \\
            -CA ${path.join(__dirname, `certs`, `ca`, `root-ca.crt.pem`)} \\
            -CAkey ${path.join(__dirname, `certs`, `ca`, `root-ca.key.pem`)} \\
            -CAcreateserial \\
            -out ${path.join(__dirname, `certs`, `server`, `server.crt.pem`)} \\
            -days 1095`);
    });
}

if (
    argVal(`client`) ||
    argVal(`all`)
) {
    return execPromise.then(() => {
        if (!argVal(`name`)) {
            throw `No client name provided, not running client generation`;
        }

        return;
    }).then(() => {
        return fs.mkdirAsync(path.join(__dirname, `certs`, `client`));
    }).then(() => {
        return clients.findOneAsync({name: argVal(`name`)});
    }).then((doc) => {
        if (doc) {
            return doc;
        } else {
            const key = crypto.randomBytes(128).toString('base64').slice(0,64);
            const id = crypto.randomBytes(64).toString('hex').slice(0,32);
            return clients.insertAsync({name: argVal(`name`), key, id});
        }
    }).then((doc) => {
        clientDoc = doc;

        return fs.mkdirAsync(path.join(__dirname, `certs`, `client`, clientDoc.name));
    }).then(() => {
        return fs.writeFileAsync(path.join(__dirname, `certs`, `client`, clientDoc.name, `api-key.txt`), clientDoc.key);
    }).then(() => {
        return exec(`openssl genrsa \\
            -out ${path.join(__dirname, `certs`, `client`, clientDoc.name, `client.key.pem`)} \\
            2048`);
    }).then(() => {
        return exec(`openssl req -new \\
            -key ${path.join(__dirname, `certs`, `client`, clientDoc.name, `client.key.pem`)} \\
            -out ${path.join(__dirname, `certs`, `tmp`, `client.csr.pem`)} \\
            -subj "/C=GB/ST=London/L=London/O=Woodhouse Client/CN=${clientDoc.id}.${domain}"`);
    }).then(() => {
        return exec(`openssl x509 \\
            -req -in ${path.join(__dirname, `certs`, `tmp`, `client.csr.pem`)} \\
            -CA ${path.join(__dirname, `certs`, `ca`, `root-ca.crt.pem`)} \\
            -CAkey ${path.join(__dirname, `certs`, `ca`, `root-ca.key.pem`)} \\
            -CAcreateserial \\
            -out ${path.join(__dirname, `certs`, `client`, clientDoc.name, `client.crt.pem`)} \\
            -days 1095`);
    }).then(() => {
        return exec(`rsync -a ${path.join(__dirname, `certs`, `ca`, `root-ca.crt.pem`)} ${path.join(__dirname, `certs`, `client`, clientDoc.name)}`);
    });
}
