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
            {
                id: 'halt',
                listener: '(halt|die)',
                role: 'admin',
                command: (from, interfaceName) => {
                    this.dispatcher.sendMessage(from, interfaceName, 'Halting now!');
                    process.exit();
                }
            }
        );
    }

    loadYesNoListeners() {
        this.dispatcher.listen(
            {name: 'yesNo', displayname: 'Yes/No Questions'},
            {
                id: `yes`,
                listener: 'yes',
                role: 'standard',
                command: (from, interfaceName) => {
                    const yesNoQuestion = this.yesNo.returnLastYesNoQuestion(from);

                    if (yesNoQuestion) {
                        if (typeof yesNoQuestion.yesCallback === 'function') {
                            yesNoQuestion.yesCallback();
                        }

                        this.yesNo.removeLastYesNoQuestion(from);
                    }
                }
            }
        );

        this.dispatcher.listen(
            {name: 'yesNo', displayname: 'Yes/No Questions'},
            {
                id: `no`,
                listener: 'no',
                role: 'standard',
                command: (from, interfaceName) => {
                    const yesNoQuestion = this.yesNo.returnLastYesNoQuestion(from);

                    if (yesNoQuestion) {
                        if (typeof yesNoQuestion.noCallback === 'function') {
                            yesNoQuestion.noCallback();
                        }

                        this.yesNo.removeLastYesNoQuestion(from);
                    }
                }
            }
        );

        this.dispatcher.listen(
            {name: 'yesNo', displayname: 'Yes/No Questions'},
            {
                id: `next`,
                listener: 'next question',
                role: 'standard',
                command: (from, interfaceName) => {
                    const yesNoQuestion = this.yesNo.returnLastYesNoQuestion(from);

                    if (yesNoQuestion) {
                        this.dispatcher.sendMessage(from, interfaceName, yesNoQuestion.question);
                    } else {
                        this.dispatcher.sendMessage(from, interfaceName, 'No more questions to ask!');
                    }
                }
            }
        );
    }

    loadRolesListeners() {
        this.dispatcher.listen(
            {name: 'roles', displayname: 'Roles'},
            {
                id: `trusted`,
                listener: 'roles (:<role>ignore|standard) (:<name>.+?)',
                role: 'trusted',
                command: (from, interfaceName, message) => {
                    this.users.setRole(message.name, message.role).then(() => {
                        this.dispatcher.sendMessage(
                            from,
                            interfaceName,
                            message.name + ' set as ' + message.role
                        );
                    }).catch((error) => {
                        this.dispatcher.sendMessage(from, interfaceName, error.message);
                    });
                }
            }
        );

        this.dispatcher.listen(
            {name: 'roles', displayname: 'Roles'},
            {
                id: `admin`,
                listener: 'roles (:<role>trusted|admin) (:<name>.+?)',
                role: 'admin',
                command: (from, interfaceName, message) => {
                    this.users.setRole(message.name, message.role).then(() => {
                        this.dispatcher.sendMessage(
                            from,
                            interfaceName,
                            message.name + ' set as ' + message.role
                        );
                    }).catch((error) => {
                        this.dispatcher.sendMessage(from, interfaceName, error.message);
                    });
                }
            }
        );

        const permissionRequests = {};

        this.dispatcher.listen(
            {name: 'roles', displayname: 'Roles'},
            {
                id: `request`,
                listener: 'roles request (:<role>.+?)',
                role: 'ignore',
                command: (from, interfaceName, message, user) => {
                    this.users.userFromAccount(user, interfaceName).then((userDoc) => {
                        permissionRequests[userDoc.username] = {
                            role: message.role
                        };
                        this.dispatcher.sendMessage(
                            from,
                            interfaceName,
                            'You have requested ' + message.role + ' permissions'
                        );
                    }).catch((error) => {
                        this.dispatcher.sendMessage(from, interfaceName, error.message);
                    });
                }
            }
        );

        this.dispatcher.listen(
            {name: 'roles', displayname: 'Roles'},
            {
                id: `list`,
                listener: 'roles list requests',
                role: 'trusted',
                command: (from, interfaceName, message, user) => {
                    let reply = '';

                    for (var key in permissionRequests) {
                        reply += key + ' requests ' + permissionRequests[key].role + '\n';
                    }

                    this.dispatcher.sendMessage(from, interfaceName, reply);
                }
            }
        );
    }

    loadConfigListeners() {
        this.dispatcher.listen(
            {name: 'config', displayname: 'Config'},
            {
                id: `enable`,
                listener: 'config enable (:<module_type>plugin|interface) (:<module_name>.+?)',
                role: 'admin',
                command: (from, interfaceName, message, user) => {
                    this.moduleData.set(message.module_type, message.module_name, 'enabled', true).then(() => {
                        this.dispatcher.sendMessage(from, interfaceName, `The ${message.module_name} ${message.module_type} has been enabled`);
                    });
                }
            }
        );

        this.dispatcher.listen(
            {name: 'config', displayname: 'Config'},
            {
                id: `disable`,
                listener: 'config disable (:<module_type>plugin|interface) (:<module_name>.+?)',
                role: 'admin',
                command: (from, interfaceName, message, user) => {
                    this.moduleData.set(message.module_type, message.module_name, 'enabled', false).then(() => {
                        this.dispatcher.sendMessage(from, interfaceName, `The ${message.module_name} ${message.module_type} has been disabled`);
                    });
                }
            }
        );

        this.dispatcher.listen(
             {name: 'config', displayname: 'Config'},
            {
                id: `list`,
                listener: 'config list (preferences|prefs) (:<module_type>plugin|interface) (:<module_name>.+?)',
                role: 'admin',
                command: (from, interfaceName, message, user) => {
                    this.moduleData.getAllPrefs(message.module_type, message.module_name).then((prefs) => {
                        let outputString = '';

                        Object.keys(prefs).forEach((prefKey) => {
                            outputString += `${prefs[prefKey].displayname}\n    Pref name: ${prefKey}\n    Current value: ${prefs[prefKey].value}\n`;
                        });

                        this.dispatcher.sendMessage(from, interfaceName, outputString);
                    });
                }
            }
        );

        this.dispatcher.listen(
            {name: 'config', displayname: 'Config'},
            {
                id: `set`,
                listener: 'config set (preference|pref) (:<preference_name>.+?) (:<value>.+?) (:<module_type>plugin|interface) (:<module_name>.+?)',
                role: 'admin',
                command: (from, interfaceName, message, user) => {
                    this.moduleData.setPref(message.module_type, message.module_name, message.preference_name, message.value).then((prefs) => {
                        this.dispatcher.sendMessage(from, interfaceName, `Preference ${message.preference_name} set to ${message.value} for ${message.module_type} ${message.module_name}`);
                    });
                }
            }
        );
    }
}

module.exports = coreListeners;
