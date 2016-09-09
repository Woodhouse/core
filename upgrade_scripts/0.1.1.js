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
		return this.interfacePrefData.updateAsync({}, {$set: {default_permission: ''}}, { multi: true });
	}
}

module.exports = upgrade;