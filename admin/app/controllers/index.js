import Ember from 'ember';

export default Ember.ArrayController.extend({
    actions: {
        save: function(){
            var message;
            this.get('model').save();
        }
    }
});
