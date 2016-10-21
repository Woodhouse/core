class upgrade {
	constructor(systemData, interfacePrefData, pluginPrefData, basePrefData, usersData, cronData) {
		this.systemData = systemData;
        this.interfacePrefData = interfacePrefData;
        this.pluginPrefData = pluginPrefData;
        this.basePrefData = basePrefData;
        this.usersData = usersData;
        this.cronData = cronData;
	}

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