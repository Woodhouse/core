import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr('string'),
  displayname: DS.attr('string'),
  description: DS.attr('string'),
  default_permission: DS.attr('string'),
  enabled: DS.attr('boolean'),
  prefs: DS.hasMany('pref', {inverse: 'interface'}),
  uiMessage: DS.hasMany('uiMessage', {inverse: 'interface'}),
  canAddNewPrefs: DS.attr('boolean'),
  newPrefsTemplate: DS.hasMany('pref'),
  getGroupedPrefs: function(){
    var prefsObj = {};
    this.get('prefs').forEach(function(item){
        if (!prefsObj[item.get('group')]) {
            prefsObj[item.get('group')] = [];
        }

        prefsObj[item.get('group')].push(item);
    });

    var prefsArr = [];
    for (var key in prefsObj) {
        prefsArr.push(prefsObj[key]);
    }

    return prefsArr;
  }.property('prefs.@each'),
  enabledClass: function(){
    return this.get('enabled') ? 'enabled-true' : 'enabled-false';
  }.property('enabled')
});
