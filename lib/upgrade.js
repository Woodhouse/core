'use strict';

const bluebird = require(`bluebird`);
const fs = bluebird.promisifyAll(require(`fs.extra`));
const semver = require(`semver`);
const path = require(`path`);
let backedUp = false;

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
		return fs.readFileAsync(path.join(__dirname, `..`, `package.json`))
            .then((packageJSON) => {
    			return JSON.parse(packageJSON).version;
    		}).then((targetVersion) => {
                let currentVersion;
                const currentVersionPromise = this.systemData.findOneAsync({name: `version`}).then((versionDoc) => {
                    if (!versionDoc) {
                        // This is probably a fresh install, so nothing exists!
                        // Create the version doc so we can update later
                        return this.systemData.insertAsync({name: `version`, value: `0.0.0`});
                    }

                        return versionDoc;
                    }).then((versionDoc) => {
                        currentVersion = versionDoc.value;
                        return versionDoc.value;
                    });

                return bluebird.all([
                    fs.readdirAsync(path.join(__dirname, `..`, `upgrade_scripts`)),
                    currentVersionPromise
                ]).spread((files, currentVersion) => {
                    files = files.map((file) => {
                        return file.slice(0, -3);
                    }).filter((version) => {
                        return !!semver.satisfies(version, `>${currentVersion} <=${targetVersion}`);
                    }).sort((a, b) => {
                        return semver.gt(a, b) ? 1 : -1;
                    });

                    return files;
                }).then((files) => {
                    if (files.length > 0) {
                        return bluebird.all([
                            fs.copy(`system-data.db`, `system-data.db.backup`, {replace: true}),
                            fs.copy(`interface-prefs.db`, `interface-prefs.db.backup`, {replace: true}),
                            fs.copy(`plugin-prefs.db`, `plugin-prefs.db.backup`, {replace: true}),
                            fs.copy(`base-prefs.db`, `base-prefs.db.backup`, {replace: true}),
                            fs.copy(`users.db`, `users.db.backup`, {replace: true}),
                            fs.copy(`cron.db`, `cron.db.backup`, {replace: true})
                        ]).catch((error) => {
                            throw new Error(`Database backup aborted, reason: ` + error);
                        }).then(() => {
                            backedUp = true;
                            return files;
                        });
                    }
                    return files;
                }).map((version) => {
                    const filePath = path.join(__dirname, `..`, `upgrade_scripts`, `${version}.js`);
                    const file = require(filePath);
                    const script = new file();

                    const methods = Object.getOwnPropertyNames(file.prototype).filter((name) => {
                        if (name === `constructor`) {
                            return false;
                        } else if (name === `final`) {
                            return true;
                        }

                        return semver.gt(`${version}-${name}`, currentVersion);
                    }).sort((a, b) => {
                        if (a === `final`) {
                            return 1;
                        }

                        return semver.gt(`${version}-${a}`, `${version}-${b}`) ? 1 : -1;
                    });

                    script.run = () => {
                        return bluebird.each(methods, (name) => {
                            return script[name]();
                        }).then((names) => {
                            const lastMethod = names.pop();

                            if (!lastMethod) {
                                return bluebird.resolve();
                            }
                            if (lastMethod === `final`) {
                                return version;
                            }

                            return `${version}-${lastMethod}`;
                        });
                    };

                    script.systemData = this.systemData;
                    script.interfacePrefData = this.interfacePrefData;
                    script.pluginPrefData = this.pluginPrefData;
                    script.basePrefData = this.basePrefData;
                    script.usersData = this.usersData;
                    script.cronData = this.cronData;

                    return script.run();
                }).then((versions) => {
                    const version = versions.pop();

                    if (version) {
                        return this.systemData.updateAsync({name: `version`}, {$set: {value: version}});
                    }

                    return bluebird.resolve();
                }).catch((error) => {
                    if (backedUp) {
                        return bluebird.all([
                            fs.copy(`system-data.db.backup`, `system-data.db`, {replace: true}),
                            fs.copy(`interface-prefs.db.backup`, `interface-prefs.db`, {replace: true}),
                            fs.copy(`plugin-prefs.db.backup`, `plugin-prefs.db`, {replace: true}),
                            fs.copy(`base-prefs.db.backup`, `base-prefs.db`, {replace: true}),
                            fs.copy(`users.db.backup`, `users.db`, {replace: true}),
                            fs.copy(`cron.db.backup`, `cron.db`, {replace: true})
                        ]).then(() => {
                            console.error(`Upgrade stopped and rolled back. Reason:` + error);
                        });
                    }

                    console.error(`Upgrade stopped and rolled back. Reason: ` + error);
                });
            });
	}
}

module.exports = upgrade;
