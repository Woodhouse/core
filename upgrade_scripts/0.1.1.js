class upgrade {
	run() {
		return this.interfacePrefData.updateAsync({}, {$set: {default_permission: ''}}, { multi: true });
	}
}

module.exports = upgrade;