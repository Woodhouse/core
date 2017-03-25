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
            'roles (:<role>ignore|standard) (:<name>.+?)',
            'trusted',
            (from, interfaceName, message) => {
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
        );

        this.dispatcher.listen(
            {name: 'roles', displayname: 'Roles'},
            'roles (:<role>trusted|admin) (:<name>.+?)',
            'admin',
            (from, interfaceName, message) => {
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
        );

        const permissionRequests = {};

        this.dispatcher.listen(
            {name: 'roles', displayname: 'Roles'},
            'roles request (:<role>.+?)',
            'ignore',
            (from, interfaceName, message, user) => {
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
            'config enable (:<module_type>plugin|interface) (:<module_name>.+?)',
            'admin',
            (from, interfaceName, message, user) => {
                this.moduleData.set(message.module_type, message.module_name, 'enabled', true).then(() => {
                    this.dispatcher.sendMessage(from, interfaceName, `The ${message.module_name} ${message.module_type} has been enabled`);
                });
            }
        );

        this.dispatcher.listen(
            {name: 'config', displayname: 'Config'},
            'config disable (:<module_type>plugin|interface) (:<module_name>.+?)',
            'admin',
            (from, interfaceName, message, user) => {
                this.moduleData.set(message.module_type, message.module_name, 'enabled', false).then(() => {
                    this.dispatcher.sendMessage(from, interfaceName, `The ${message.module_name} ${message.module_type} has been disabled`);
                });
            }
        );

        this.dispatcher.listen(
             {name: 'config', displayname: 'Config'},
            'config list (preferences|prefs) (:<module_type>plugin|interface) (:<module_name>.+?)',
            'admin',
            (from, interfaceName, message, user) => {
                this.moduleData.getAllPrefs(message.module_type, message.module_name).then((prefs) => {
                    let outputString = '';

                    Object.keys(prefs).forEach((prefKey) => {
                        outputString += `${prefs[prefKey].displayname}\n    Pref name: ${prefKey}\n    Current value: ${prefs[prefKey].value}\n`;
                    });

                    this.dispatcher.sendMessage(from, interfaceName, outputString);
                });
            }
        );

        this.dispatcher.listen(
             {name: 'config', displayname: 'Config'},
            'config set (preference|pref) (:<preference_name>.+?) (:<value>.+?) (:<module_type>plugin|interface) (:<module_name>.+?)',
            'admin',
            (from, interfaceName, message, user) => {
                this.moduleData.setPref(message.module_type, message.module_name, message.preference_name, message.value).then((prefs) => {
                    this.dispatcher.sendMessage(from, interfaceName, `Preference ${message.preference_name} set to ${message.value} for ${message.module_type} ${message.module_name}`);
                });
            }
        );
    }
}

module.exports = coreListeners;
