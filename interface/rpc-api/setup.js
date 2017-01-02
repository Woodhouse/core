'use strict';

const bluebird = require(`bluebird`);
const args = process.argv.slice(2);
const path = require(`path`);
const fs = bluebird.promisifyAll(require(`fs`));
const exec = bluebird.promisify(require('child_process').exec);
let execPromise = bluebird.resolve();

if (args.indexOf(`server`) > -1 || args.indexOf(`all`) > -1 || args.length === 0) {
    execPromise = fs.mkdirAsync(path.join(__dirname, `certs`)).then(() => {
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
            -subj "/C=GB/ST=London/L=London/O=Woodhouse Signing Authority/CN=hellowoodhouse.com"`);
    }).then(() => {
        return fs.mkdirAsync(path.join(__dirname, `certs`, `server`));
    }).then(() => {
        return exec(`openssl genrsa \\
            -out ${path.join(__dirname, `certs`, `server`, `server.key.pem`)} \\
            2048`);
    }).then(() => {
        return exec(`openssl req -new \\
            -key ${path.join(__dirname, `certs`, `server`, `server.key.pem`)} \\
            -out ${path.join(__dirname, `certs`, `tmp`, `server.csr.pem`)} \\
            -subj "/C=GB/ST=London/L=London/O=Woodhouse Instance/CN=local.hellowoodhouse.com"`);
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

if (args.indexOf(`client`) > -1 || args.indexOf(`all`) > -1 || args.length === 0) {
    return execPromise.then(() => {
        return fs.mkdirAsync(path.join(__dirname, `certs`, `client`));
    }).then(() => {
        return exec(`openssl genrsa \\
            -out ${path.join(__dirname, `certs`, `client`, `client.key.pem`)} \\
            2048`);
    }).then(() => {
        return exec(`openssl req -new \\
            -key ${path.join(__dirname, `certs`, `client`, `client.key.pem`)} \\
            -out ${path.join(__dirname, `certs`, `tmp`, `client.csr.pem`)} \\
            -subj "/C=GB/ST=London/L=London/O=Woodhouse Client/CN=client.hellowoodhouse.net"`);
    }).then(() => {
        return exec(`openssl x509 \\
            -req -in ${path.join(__dirname, `certs`, `tmp`, `client.csr.pem`)} \\
            -CA ${path.join(__dirname, `certs`, `ca`, `root-ca.crt.pem`)} \\
            -CAkey ${path.join(__dirname, `certs`, `ca`, `root-ca.key.pem`)} \\
            -CAcreateserial \\
            -out ${path.join(__dirname, `certs`, `client`, `client.crt.pem`)} \\
            -days 1095`);
    }).then(() => {
        return exec(`rsync -a ${path.join(__dirname, `certs`, `ca`, `root-ca.crt.pem`)} ${path.join(__dirname, `certs`, `client`)}`);
    });
}
