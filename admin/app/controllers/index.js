import Ember from 'ember';

export default Ember.ArrayController.extend({
    actions: {
        save: function(){
            this.get('model').save();
        }
    }
});
