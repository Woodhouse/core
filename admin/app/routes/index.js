import Ember from 'ember';

export default Ember.Route.extend({
    model: function() {
        return this.store.filter('pref', null, function(pref){
            return pref.get('interface') === null && pref.get('plugin') === null;
        });
    }
});
