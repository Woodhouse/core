class upgrade {
	run() {
        return this.interfacePrefData.insertAsync({
            name: `rpc-api`,
            displayname: `RPC API`,
            description: `Issue commands through an API`,
            enabled: false,
            prefs: [{
                name: `port`,
                value: 8080,
                type: `text`
            }]
        }).then(() => {
            return this.usersData.insertAsync({
                username: `api-user`,
                accounts: {
                    'rpc-api': `api-user`
                },
                role: `standard`,
                defaultAccount: `rpc-user`
            });
        });
	}
}

module.exports = upgrade;