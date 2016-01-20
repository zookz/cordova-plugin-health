var exec = require("cordova/exec");

var Health = function () {
  this.name = "health";
};

Health.prototype.isAvailable = function (onSuccess, onError) {
  exec(onSuccess, onError, "health", "isAvailable", []);
};

Health.prototype.requestAuthorization = function (datatypes, onSuccess, onError) {
  exec(onSuccess, onError, "health", "requestAuthorization", datatypes);
};

Health.prototype.query = function (opts, onSuccess, onError) {
  navigator.health.requestAuthorization([opts.dataType], function(){
    //calories.active is done by asking all calories and subtracting the basal
    if(opts.dataType =='calories.active'){
      //get basal average in the time window
      opts.dataType ='calories.basal';
      navigator.health.queryAggregated(opts, function(data){
        var basal_ms = data.value / (data.endDate.getTime() - data.startDate.getTime());
        //now get the total
        opts.dataType ='calories';
        navigator.health.query(opts, function(data){
          //and subtract the basal
          for(var i=0; i<data.length; i++){
            data[i].value -= basal_ms * (data[i].endDate.getTime() - data[i].startDate.getTime());
            if(data[i].value <0) data[i].value = 0; //negative values don't make sense
          }
          onSuccess(data);
        }, onError);
      }, onError);
    } else {
      if(opts.startDate && (typeof opts.startDate == 'object'))
      opts.startDate = opts.startDate.getTime();
      if(opts.endDate && (typeof opts.endDate == 'object'))
      opts.endDate = opts.endDate.getTime();
      exec(function(data){
        for(var i=0; i<data.length; i++){
          data[i].startDate = new Date(data[i].startDate);
          data[i].endDate = new Date(data[i].endDate);
        }
        onSuccess(data);
      }, onError, "health", "query", [opts]);
    }
  }, onError);
};

Health.prototype.queryAggregated = function (opts, onSuccess, onError) {
  navigator.health.requestAuthorization([opts.dataType], function(){
    if(opts.dataType =='calories.active'){
      //get basal average in the time window
      opts.dataType ='calories.basal';
      navigator.health.queryAggregated(opts, function(data){
        var basal_ms = data.value / (data.endDate.getTime() - data.startDate.getTime());
        //now get the total
        opts.dataType ='calories';
        navigator.health.queryAggregated(opts, function(data){
          data.value -= basal_ms * (data.endDate.getTime() - data.startDate.getTime());
          onSuccess(data);
        }, onError);
      }, onError);
    } else {
      if(opts.startDate && (typeof opts.startDate == 'object'))
      opts.startDate = opts.startDate.getTime();
      if(opts.endDate && (typeof opts.endDate == 'object'))
      opts.endDate = opts.endDate.getTime();
      exec(function(data){
        //reconvert the dates back to Date objects
        data.startDate = new Date(data.startDate);
        data.endDate = new Date(data.endDate);
        onSuccess(data);
      }, onError, "health", "queryAggregated", [opts]);
    }
  }, onError);
};

Health.prototype.store = function (data, onSuccess, onError) {
  navigator.health.requestAuthorization([data.dataType], function(){
    if(data.startDate && (typeof opts.startDate == 'object'))
    data.startDate = data.startDate.getTime();
    if(data.endDate && (typeof opts.endDate == 'object'))
    data.endDate = data.endDate.getTime();
    if(data.dataType =='activity'){
      data.value = navigator.health.toFitActivity(data.value);
    }
    if(opts.dataType =='calories.active'){
      opts.dataType =='calories'; //TODO: should add basal calories before storing
    }
    exec(onSuccess, onError, "health", "store", [data]);
  }, onError);
};

Health.prototype.toFitActivity = function(act){
  //unsupported activities are mapped to 'other'
  if((act == 'archery') ||
  (act == 'bowling') ||
  (act == 'fishing') ||
  (act == 'functional_strength') ||
  (act == 'hunting') ||
  (act == 'lacrosse') ||
  (act == 'mixed_metabolic_cardio') ||
  (act == 'paddle_sports') ||
  (act == 'play') ||
  (act == 'preparation_and_recovery') ||
  (act == 'snow_sports') ||
  (act == 'softball') ||
  (act == 'water_fitness') ||
  (act == 'water_sports') ||
  (act == 'wrestling'))
  return 'other';
  else return act;
};

cordova.addConstructor(function(){
  navigator.health = new Health();
  return navigator.health;
});
