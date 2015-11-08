import DS from 'ember-data';

export default DS.Model.extend({
  listener: DS.attr('string'),
  alias: DS.attr('string'),
  plugin: DS.belongsTo('plugin', {inverse: 'listeneraliases'})
});
