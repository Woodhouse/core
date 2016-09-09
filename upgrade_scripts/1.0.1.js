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
		return this.usersData.findAsync({}).map((user) => {
			return this.usersData.insertAsync({
                username: user.name,
                accounts:{[user.interface]: user.name},
                role: user.role,
                defaultAccount: user.interface
            }).then(() => {
                return this.usersData.removeAsync({_id: user._id});
            });
		});
	}
}

module.exports = upgrade;