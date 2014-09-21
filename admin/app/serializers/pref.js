import DS from 'ember-data';

export default DS.RESTSerializer.extend(DS.EmbeddedRecordsMixin, {
    attrs: {
        interface: {serialize:'no',  deserialize:'no'},
        plugin: {serialize:'no',  deserialize:'no'}
    }
});
