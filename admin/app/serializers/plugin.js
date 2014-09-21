import DS from 'ember-data';

export default DS.RESTSerializer.extend(DS.EmbeddedRecordsMixin, {
    attrs: {
        prefs: {serialize:'records',  deserialize:false},
        uiMessage: {serialize:false,  deserialize:false}
    },
    keyForAttribute: function(attr) {
        return attr;
    },
    keyForRelationship: function(relationship) {
        return relationship;
    }
});
