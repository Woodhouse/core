'use strict';

const bluebird = require('bluebird');
const fs = bluebird.promisifyAll(require('fs'));
const semver = require('semver');
const path = require('path');

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
		return fs.readFileAsync(path.join(__dirname, '..', 'package.json'))
            .then((packageJSON) => {
    			return JSON.parse(packageJSON).version;
    		}).then((targetVersion) => {

                const currentVersion = this.systemData.findOneAsync({name: 'version'}).then((versionDoc) => {
                    if (!versionDoc) {
                        // This is probably a fresh install, so nothing exists!
                        // Create the version doc so we can update later
                        return this.systemData.insertAsync({name: 'version', value: '0.0.0'});
                    }

                    return versionDoc;
                }).then((versionDoc) => {
                    return versionDoc.value;
                });
                return bluebird.all([
                    fs.readdirAsync(path.join(__dirname, '..', 'upgrade_scripts')),
                    currentVersion
                ]).spread((files, currentVersion) => {
                    files = files.map((file) => {
                        return file.slice(0, -3);
                    }).filter((version) => {
                        return !!semver.satisfies(version, `>${currentVersion} <=${targetVersion}`);
                    }).sort((a, b) => {
                        return semver.gt(a, b) ? 1 : -1;
                    });

                    return files;
                }).each((version) => {
                    const file = path.join(__dirname, '..', 'upgrade_scripts', `${version}.js`);
                    const script = new (require(file))(
                        this.systemData ,
                        this.interfacePrefData ,
                        this.pluginPrefData ,
                        this.basePrefData ,
                        this.usersData ,
                        this.cronData
                    );

                    return script.run();
                }).then(() => {
                    return this.systemData.updateAsync({name: 'version'}, {$set: {value: targetVersion}});
                });
            });
	}
}

module.exports = upgrade;