'use strict';

class coreListeners {
    constructor(dispatcher, moduleData, systemPrefs, cron, yesNo, users) {
        this.dispatcher = dispatcher;
        this.moduleData = moduleData;
        this.systemPrefs = systemPrefs;
        this.cron = cron;
        this.yesNo = yesNo;
        this.users = users;

        this.loadSystemListeners();
        this.loadYesNoListeners();
        this.loadRolesListeners();
        this.loadConfigListeners();
    }

    loadSystemListeners() {
        this.dispatcher.listen(
            {name: 'system', displayname: 'System'},
            '(halt|die)',
            'admin',
            (from, interfaceName) => {
                this.dispatcher.sendMessage(from, interfaceName, 'Halting now!');
                process.exit();
            }
        );
    }

    loadYesNoListeners() {
        this.dispatcher.listen(
            {name: 'yesNo', displayname: 'Yes/No Questions'},
            'yes',
            'standard',
            (from, interfaceName) => {
                const yesNoQuestion = this.yesNo.returnLastYesNoQuestion(from);

                if (yesNoQuestion) {
                    if (typeof yesNoQuestion.yesCallback === 'function') {
                        yesNoQuestion.yesCallback();
                    }

                    this.yesNo.removeLastYesNoQuestion(from);
                }
            }
        );

        this.dispatcher.listen(
            {name: 'yesNo', displayname: 'Yes/No Questions'},
            'no',
            'standard',
            (from, interfaceName) => {
                const yesNoQuestion = this.yesNo.returnLastYesNoQuestion(from);

                if (yesNoQuestion) {
                    if (typeof yesNoQuestion.noCallback === 'function') {
                        yesNoQuestion.noCallback();
                    }

                    this.yesNo.removeLastYesNoQuestion(from);
                }
            }
        );

        this.dispatcher.listen(
            {name: 'yesNo', displayname: 'Yes/No Questions'},
            'next question',
            'standard',
            (from, interfaceName) => {
                const yesNoQuestion = this.yesNo.returnLastYesNoQuestion(from);

                if (yesNoQuestion) {
                    this.dispatcher.sendMessage(from, interfaceName, yesNoQuestion.question);
                } else {
                    this.dispatcher.sendMessage(from, interfaceName, 'No more questions to ask!');
                }
            }
        );
    }

    loadRolesListeners() {
        this.dispatcher.listen(
            {name: 'roles', displayname: 'Roles'},
            'roles (ignore|standard) (:<name>.+?)',
            'trusted',
            (from, interfaceName, message) => {
                this.users.setRole(message[1], message[0]).then(() => {
                    this.dispatcher.sendMessage(
                        from,
                        interfaceName,
                        message[1] + ' set as ' + message[0]
                    );
                }).catch((error) => {
                    this.dispatcher.sendMessage(from, interfaceName, error.message);
                });
            }
        );

        this.dispatcher.listen(
            {name: 'roles', displayname: 'Roles'},
            'roles (trusted|admin) (:<name>.+?)',
            'admin',
            (from, interfaceName, message) => {
                this.users.setRole(message[1], message[0]).then(() => {
                    this.dispatcher.sendMessage(
                        from,
                        interfaceName,
                        message[1] + ' set as ' + message[0]
                    );
                }).catch((error) => {
                    this.dispatcher.sendMessage(from, interfaceName, error.message);
                });
            }
        );

        const permissionRequests = {};

        this.dispatcher.listen(
            {name: 'roles', displayname: 'Roles'},
            'roles request (:<role>.+?)',
            'ignore',
            (from, interfaceName, message, user) => {
                this.users.userFromAccount(user, interfaceName).then((userDoc) => {
                    permissionRequests[userDoc.username] = {
                        role: message[0]
                    };
                    this.dispatcher.sendMessage(
                        from,
                        interfaceName,
                        'You have requested ' + message[0] + ' permissions'
                    );
                }).catch((error) => {
                    this.dispatcher.sendMessage(from, interfaceName, error.message);
                });
            }
        );

        this.dispatcher.listen(
            {name: 'roles', displayname: 'Roles'},
            'roles list requests',
            'trusted',
            (from, interfaceName, message, user) => {
                let reply = '';

                for (var key in permissionRequests) {
                    reply += key + ' requests ' + permissionRequests[key].role + '\n';
                }

                this.dispatcher.sendMessage(from, interfaceName, reply);
            }
        );
    }

    loadConfigListeners() {
        this.dispatcher.listen(
            {name: 'config', displayname: 'Config'},
            'config enable (plugin|interface) (:<plugin or interface name>.+?)',
            'admin',
            (from, interfaceName, message, user) => {
                this.moduleData.set(message[0], message[1], 'enabled', true).then(() => {
                    this.dispatcher.sendMessage(from, interfaceName, `The ${message[1]} ${message[0]} has been enabled`);
                });
            }
        );

        this.dispatcher.listen(
            {name: 'config', displayname: 'Config'},
            'config disable (plugin|interface) (:<plugin or interface name>.+?)',
            'admin',
            (from, interfaceName, message, user) => {
                this.moduleData.set(message[0], message[1], 'enabled', false).then(() => {
                    this.dispatcher.sendMessage(from, interfaceName, `The ${message[1]} ${message[0]} has been disabled`);
                });
            }
        );

        this.dispatcher.listen(
             {name: 'config', displayname: 'Config'},
            'config list preferences (plugin|interface) (:<plugin or interface name>.+?)',
            'admin',
            (from, interfaceName, message, user) => {
                this.moduleData.getAllPrefs(message[0], message[1]).then((prefs) => {
                    let outputString = '';

                    prefs.forEach((pref) => {
                        outputString += `${pref.displayname}\n    Pref name: ${pref.name}\n    Current value: ${pref.value}\n`;
                    });

                    this.dispatcher.sendMessage(from, interfaceName, outputString);
                });
            }
        );

        this.dispatcher.listen(
             {name: 'config', displayname: 'Config'},
            'config set preference (:<preference name>.+?) (:<value>.+?) (plugin|interface) (:<plugin or interface name>.+?)',
            'admin',
            (from, interfaceName, message, user) => {
                this.moduleData.setPref(message[2], message[3], message[0], message[1]).then((prefs) => {
                    this.dispatcher.sendMessage(from, interfaceName, `Preference ${message[0]} set to ${message[1]} for ${message[2]} ${message[3]}`);
                });
            }
        );
    }
}

module.exports = coreListeners;
