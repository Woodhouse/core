import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  this.resource('interfaces', function() {
    this.route('show', {path: ':name'});
  });
  this.resource('plugins', function() {
    this.route('show', {path: ':name'});
  });
});

export default Router;
