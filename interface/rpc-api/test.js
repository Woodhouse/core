#!/usr/bin/env node
'use strict';

const https = require(`https`);
const fs = require(`fs`);
const path = require(`path`);
const hostname = `local.hellowoodhouse.com`
const port = 8443;
const evilDns = require(`evil-dns`);

// String match
evilDns.add(hostname, `127.0.0.1`);


let req = https.request({
    host: hostname,
    port: port,
    path: `/`,
    method: `POST`,
    ca: fs.readFileSync(path.join(__dirname, `certs`, `client`, `root-ca.crt.pem`)),
    key: fs.readFileSync(path.join(__dirname, `certs`, `client`, `client.key.pem`)),
    cert: fs.readFileSync(path.join(__dirname, `certs`, `client`, `client.crt.pem`)),
    headers: {
        'x-auth-key': `RODAgpl6I1/LwFbbnaR2jJ5tbZkBAZZwLl4f88Up+bU=`
    }
}, function(res) {
    res.pipe(process.stdout);
});

req.write(`woodhouse say hello`);
req.end();
