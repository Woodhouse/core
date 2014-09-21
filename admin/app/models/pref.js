import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr('string'),
  type: DS.attr('string'),
  value: DS.attr('string'),
  interface: DS.belongsTo('interface', {inverse: 'prefs'}),
  plugin: DS.belongsTo('plugin', {inverse: 'prefs'}),
  group: DS.attr('string'),
  isPassword: function(){
    return this.get('type') === 'password';
  }.property('type'),
  isText: function(){
    return this.get('type') === 'text';
  }.property('type'),
  isBoolean: function(){
    return this.get('type') === 'boolean';
  }.property('type')
});
