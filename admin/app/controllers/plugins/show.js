import Ember from 'ember';

export default Ember.ObjectController.extend({
    setupController: function(controller, model) {
        controller.set('model', model);
    },
    actions: {
        save: function(){
            var self = this;
            this.get('model').save().then(function() {
                self.wuphf.success('Successfully saved', 5000);
            }).catch(function() {
                self.wuphf.danger('There was an error saving', 5000);
            });
        },
        addNewPrefs: function(){
            var self = this;
            var prefs = [];
            this.get('model.newPrefsTemplate').forEach(function(item){
                var group = self.get('model.name') + self.get('model.getGroupedPrefs').length;
                prefs.push({
                    id: self.get('model.name') + item.get('name') + group,
                    name: item.get('name'),
                    type: item.get('type'),
                    value: item.get('value'),
                    plugin: self.get('model'),
                    group: group
                });
            });

            for (var i = 0, len = prefs.length; i < len; i++) {
                var pref = this.store.createRecord('pref', prefs[i]);
                this.get('model.prefs').pushObject(pref);
            }
        }
    }
});
