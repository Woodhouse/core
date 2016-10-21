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
        });
	}
}

module.exports = upgrade;