const crypto = require('crypto');

class upgrade {
	run() {
        return this.interfacePrefData.findAsync({}).each((item) => {
            let newPrefs = {};

            item.prefs.forEach((pref) => {
                const name = pref.name;

                delete pref.name;

                newPrefs[name] = pref;
            });

            item.prefs = newPrefs;

            return this.interfacePrefData.updateAsync({_id: item._id}, item);
        }).then(() => {
            return this.pluginPrefData.findAsync({});
        }).each((item) => {
            let newPrefs = {};

            item.prefs.forEach((pref) => {
                const name = pref.name;

                delete pref.name;

                newPrefs[name] = pref;
            });

            item.prefs = newPrefs;

            return this.pluginPrefData.updateAsync({_id: item._id}, item);
        })
        .then(() => {
            return this.interfacePrefData.insertAsync({
                name: `rpc-api`,
                displayname: `RPC API`,
                description: `Issue commands through an API`,
                enabled: false,
                prefs: {
                    port: {
                        displayname: `Port`,
                        value: 8443,
                        type: `text`
                    },
                    domain: {
                        displayname: `Domain`,
                        value: `hellowoodhouse.com`,
                        type: `text`
                    }
                }
            })
        }).then(() => {
            return this.usersData.insertAsync({
                username: `api-user`,
                accounts: {
                    'rpc-api': `api-user`
                },
                role: `standard`,
                defaultAccount: `rpc-user`
            });
        }).then(() => {
            return this.pluginPrefData.insertAsync({
                name: `time`,
                displayname: `Time`,
                description: `Get the time`,
                enabled: true,
                default_permission: ``,
                canAddNewPrefs: false,
                prefs: {}
            });
        }).then(() => {
            return this.basePrefData.insertAsync([{
                name: `timezone`,
                type: `text`,
                value: `Europe/London`,
                group: null
            },{
                name: `id`,
                type: `text`,
                value: crypto.randomBytes(64).toString('hex').slice(0,32),
                group: null
            }]);
        });
    }
}

module.exports = upgrade;
