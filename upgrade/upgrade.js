var fs = require('fs');
var manifest = fs.readFileSync(__dirname + '/manifest.json');

var upgrade = function(deps) {
    this.deps = deps;
};

upgrade.prototype = function() {
    var versionParts,
        runMajors = function(manifest, keys) {
            if (keys || keys.length === 0) {
                return this.deps.promise.resolve();
            }
            var self = this,
                minors = Object.keys(manifest[keys[0]]);

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

            return runMinors.call(this, manifest[keys[0]], minors).then(function() {
                delete manifest[keys[0]];
                keys.splice(0, 1)
                if (keys.length > 0) {
                    return runMajors.call(self, manifest, keys);
                } else {
                    return self.deps.promise.resolve();
                }
            });
        },
        runMinors = function(manifest, keys) {
            if (keys || keys.length === 0) {
                return this.deps.promise.resolve();
            }
            var self = this,
                patches = Object.keys(manifest[keys[0]]);

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

            return runPatches.call(this, manifest[keys[0]], patches).then(function() {
                delete manifest[keys[0]];
                keys.splice(0, 1)
                if (keys.length > 0) {
                    return runMinors.call(self, manifest, keys);
                } else {
                    return self.deps.promise.resolve();
                }
            });
        },
        runPatches = function(manifest, keys) {
            if (keys || keys.length === 0) {
                return this.deps.promise.resolve();
            }
            var self = this;
            return runChangesets.call(this, manifest[keys[0]]).then(function() {
                delete manifest[keys[0]];
                keys.splice(0, 1)
                if (keys.length > 0) {
                    return runPatches.call(self, manifest, keys);
                } else {
                    return self.deps.promise.resolve();
                }
            });
        },
        runChangesets = function(changesets) {
            if (!changesets || changesets.length === 0) {
                return this.deps.promise.resolve();
            }
            var self = this,
                changeSetFile = require(__dirname + '/changesets/' + changesets[0]),
                changeSet = new changeSetFile(this.deps);

            return changeSet.up().then(function() {
                changesets.shift();
                return runChangesets.call(self, changesets);
            });
        };

    return {
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

            return runMajors.call(this, parsedManifest, majors);
        }
    };
}();

module.exports = upgrade;
