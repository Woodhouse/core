#!/usr/bin/env node
'use strict';

const https = require(`https`);
const fs = require(`fs`);
const path = require(`path`);
const hostname = `855c4edcc903abcb1695f24bdbd699d3.hellowoodhouse.com`
const port = 8443;
const evilDns = require(`evil-dns`);

// String match
evilDns.add(hostname, `127.0.0.1`);


let req = https.request({
    host: hostname,
    port: port,
    path: `/`,
    method: `POST`,
    ca: fs.readFileSync(path.join(__dirname, `certs`, `client`, `test`, `root-ca.crt.pem`)),
    key: fs.readFileSync(path.join(__dirname, `certs`, `client`, `test`, `client.key.pem`)),
    cert: fs.readFileSync(path.join(__dirname, `certs`, `client`, `test`, `client.crt.pem`)),
    headers: {
        'x-auth-key': fs.readFileSync(path.join(__dirname, `certs`, `client`, `test`, `api-key.txt`)),
    }
}, function(res) {
    res.pipe(process.stdout);
});

req.write(`woodhouse say hello`);
req.end();
