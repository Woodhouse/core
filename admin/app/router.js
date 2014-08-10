import Ember from 'ember';

var Router = Ember.Router.extend({
  location: WoodhouseENV.locationType
});

Router.map(function() {
  this.resource('interfaces', function() {
    this.route('show', {path: ':name'});
  });
});

export default Router;
