class upgrade {
	run() {
		return this.basePrefData.insertAsync([
            {
                'name': 'default_permission',
                'type':'text',
                'value':'standard',
                'group':null
            },
            {
                'name':'port',
                'type':'text',
                'value':'8080',
                'group':null
            },
            {
                'name':'name',
                'type':'text',
                'value':'Woodhouse',
                'group':null
            }
        ]).then(() => {
        	return this.interfacePrefData.insertAsync({
	            'name':'shell',
	            'displayname':'Shell',
	            'description':'Issue commands through the command line',
	            'enabled':true,
	            'prefs':[]
	        })
        }).then(() => {
        	return this.pluginPrefData.insertAsync({
	            'name':'say',
	            'displayname':'Say',
	            'description':'Make woodhouse say things back to you',
	            'enabled':true,
	            'prefs':[]
	        })
        }).then(() => {
        	return this.usersData.insertAsync({
	            'name':'admin',
	            'interface':'shell',
	            'role':'admin'
	        });
        });
	}
}

module.exports = upgrade;