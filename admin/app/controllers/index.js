import Ember from 'ember';

export default Ember.ArrayController.extend({
    actions: {
        save: function(){
            var self = this;
            this.get('model').save().then(function() {
                self.wuphf.success('Successfully saved', 5000);
            }).catch(function() {
                self.wuphf.danger('There was an error saving', 5000);
            });

        }
    }
});
