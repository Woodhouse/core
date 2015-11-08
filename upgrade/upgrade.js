var fs = require('fs'),
    promise = require('bluebird'),
    manifest = fs.readFileSync(__dirname + '/manifest.json'),
    runMajors,
    runMinors,
    runPatches,
    runChangesets,
    versionParts;

var upgrade = function(deps) {
    var self = this;
    this.deps = deps;

    runMajors = function(manifest, keys) {
        if (!keys || keys.length === 0) {
            return promise.resolve();
        }
        var minors = Object.keys(manifest[keys[0]]);

        minors.sort(function(a, b) {
            return a - b;
        })

        for (var i = 0; i < minors.length; i++) {
            if (parseInt(minors[i], 10) < parseInt(versionParts[1], 10)) {
                delete manifest[keys[0]][minors[i]];
                minors.splice(i--, 1);
            } else {
                break;
            }
        }

        return runMinors(manifest[keys[0]], minors).then(function() {
            delete manifest[keys[0]];
            keys.splice(0, 1)
            if (keys.length > 0) {
                return runMajors(manifest, keys);
            } else {
                return promise.resolve();
            }
        });
    }

    runMinors = function(manifest, keys) {
        if (!keys || keys.length === 0) {
            return promise.resolve();
        }
        var patches = Object.keys(manifest[keys[0]]);

        patches.sort(function(a, b) {
            return a - b;
        })

        for (var i = 0; i < patches.length; i++) {
            if (parseInt(patches[i], 10) <= parseInt(versionParts[2], 10)) {
                delete manifest[keys[0]][patches[i]];
                patches.splice(i--, 1);
            } else {
                break;
            }
        }

        return runPatches(manifest[keys[0]], patches).then(function() {
            delete manifest[keys[0]];
            keys.splice(0, 1)
            if (keys.length > 0) {
                return runMinors(manifest, keys);
            } else {
                return promise.resolve();
            }
        });
    }

    runPatches = function(manifest, keys) {
        if (!keys || keys.length === 0) {
            return promise.resolve();
        }

        return runChangesets(manifest[keys[0]]).then(function() {
            delete manifest[keys[0]];
            keys.splice(0, 1)
            if (keys.length > 0) {
                return runPatches(manifest, keys);
            } else {
                return promise.resolve();
            }
        });
    }

    runChangesets = function(changesets) {
        if (!changesets || changesets.length === 0) {
            return promise.resolve();
        }
        var changeSetFile = require(__dirname + '/changesets/' + changesets[0]),
            changeSet = new changeSetFile(self.deps);

        return changeSet.up().then(function() {
            changesets.shift();
            return runChangesets(changesets);
        });
    }
};

upgrade.prototype = {
    run: function(currentVersion){
        var parsedManifest = JSON.parse(manifest),
            majors = Object.keys(parsedManifest);

        majors.sort(function(a, b) {
            return a - b;
        })

        versionParts = currentVersion.split('.');

        for (var i = 0; i < majors.length; i++) {
            if (parseInt(majors[i], 10) < parseInt(versionParts[0], 10)) {
                delete parsedManifest[majors[i]];
                majors.splice(i--, 1);
            } else {
                break;
            }
        }

        return runMajors(parsedManifest, majors);
    }
};

module.exports = upgrade;
