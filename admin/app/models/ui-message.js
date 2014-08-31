import DS from 'ember-data';

export default DS.Model.extend({
    text: DS.attr('string'),
    type: DS.attr('string'),
    typeClass: function(){
        return 'alert-' + this.get('type');
    }.property('type'),
    interface: DS.belongsTo('interface', {inverse: 'uiMessage'}),
    plugin: DS.belongsTo('plugin', {inverse: 'uiMessage'})
});
