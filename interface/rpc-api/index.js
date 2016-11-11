`use strict`;

const http = require(`http`);

class Api {
    constructor() {
        this.name = `rpc-api`;
        this.displayname = `RPC API`;
        this.description = `Issue commands through an API`;
        this.defaultPrefs = {
            port: {displayname: `Port`, value: `8080`, type: `text`}
        };
    }

    init() {
        this.getPref(`port`).then((port) => {
            const server = http.createServer((request, response) => {
                if (request.method === `POST`) {
                    let body = ``;

                    request.on(`data`, (chunk) => {
                        body += chunk;
                    });
                    request.on(`end`, () => {
                        this.messageRecieved(`api-user`, body).then((message) => {
                            response.end(message)
                        });
                    });
                } else {
                    response.end(`RPC-API Usage: POST to this endpoint with a full command as the body, including the instance name, e.g 'woodhouse say hello'.`);
                }
            });

            server.listen(port);
        });
    }
}

module.exports = Api;
