module.exports = function(deps){

    this.get = function(params){
        if (params.length > 0) {
            return this.getTest(params);
        }

        return 'fuck yeaaaah';
    };

    this.getTest = function(params){
        return params
    };

    return this;
}
