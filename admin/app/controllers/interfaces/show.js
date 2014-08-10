import Ember from 'ember';

export default Ember.ObjectController.extend({
    setupController: function(controller, model) {
        controller.set('model', model);
    },
    actions: {
        save: function(){
            var message;
            this.get('model').save();
            message = this.store.createRecord('uiMessage', {text: 'kdfjshdfkjhskjdhf', type:'success'});
            this.get('model.uiMessage').pushObject(message);
        }
    }
});
