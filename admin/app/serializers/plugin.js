import DS from 'ember-data';

export default DS.RESTSerializer.extend(DS.EmbeddedRecordsMixin, {
    attrs: {
        prefs: {serialize:'records',  deserialize:'no'},
        uiMessage: {serialize:'no',  deserialize:'no'},
        listeneraliases: {serialize:'records',  deserialize:'no'}
    }
});
