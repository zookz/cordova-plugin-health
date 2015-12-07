cordova.define("cordova-plugin-health.Health", function(require, exports, module) {

var exec = require("cordova/exec");

var Health = function () {
    this.name = "Health";
};

Health.prototype.requestAuthorization = function (datatypes, onSuccess, onError) {
    exec(onSuccess, onError, "Health", "requestAuthorization", [datatypes]);
};

Health.prototype.query = function (opts, onSuccess, onError) {
    if(opts.startDate)
        opts.startDate = opts.startDate.getTime();
    if(opts.endDate)
        opts.endDate = opts.endDate.getTime();
    exec(function(data){
        for(var i=0; i<data.length; i++){
            data[i].startDate = new Date(data[i].startDate);
            data[i].endDate = new Date(data[i].endDate);
        }
        onSuccess(data);
    }, onError, "Health", "query", [opts]);
};

Health.prototype.store = function (data, onSuccess, onError) {
    if(data.startDate)
        data.startDate = data.startDate.getTime();
    if(data.endDate)
        data.endDate = data.endDate.getTime();
    exec(onSuccess, onError, "Health", "store", [data]);
};

window.health = new Health();

});