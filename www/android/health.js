var exec = require("cordova/exec");

var Health = function () {
  this.name = "health";
};

//when querying for basal calories, there's a bug in current Google Services SDK that doesn't allow to aggregate with basal
//the only way to fix it is to query single datapoints of the basal and then average
//this variable specifies the time window on which we query for the basal
//the longer the period, the more likely we get data points
Health.prototype.BASAL_CALORIES_QUERY_PERIOD = 100 * 24 * 60 * 60 * 1000;//100 days

Health.prototype.isAvailable = function (onSuccess, onError) {
  exec(onSuccess, onError, "health", "isAvailable", []);
};

Health.prototype.requestAuthorization = function (datatypes, onSuccess, onError) {
  exec(onSuccess, onError, "health", "requestAuthorization", datatypes);
};


Health.prototype.query = function (opts, onSuccess, onError) {
  //calories.active is done by asking all calories and subtracting the basal
  if(opts.dataType =='calories.active'){
    //get basal average in the time window between endDate and BASAL_CALORIES_QUERY_PERIOD
    navigator.health.queryAggregated({
      dataType:'calories.basal',
      endDate: opts.endDate,
      startDate: new Date(opts.endDate.getTime() - navigator.health.BASAL_CALORIES_QUERY_PERIOD)
    }, function(data){
      if(data.value == 0){
        //the time window is probably too small, let's give an error, although a better approach would just increasing the time window further
        onError('No basal metabolic energy expenditure found');
        return;
      }
      var basal_ms = data.value / navigator.health.BASAL_CALORIES_QUERY_PERIOD;
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
};

Health.prototype.queryAggregated = function (opts, onSuccess, onError) {
  if(opts.dataType =='calories.active'){
    //get basal average
    navigator.health.queryAggregated({
      dataType:'calories.basal',
      endDate: opts.endDate,
      startDate: new Date(opts.endDate.getTime() - navigator.health.BASAL_CALORIES_QUERY_PERIOD)
    }, function(data){
      if(data.value == 0){
        //the time window is probably too small, let's give an error, although a better approach would just increasing the time window further
        onError('No basal metabolic energy expenditure found');
        return;
      }
      var basal_ms = data.value / navigator.health.BASAL_CALORIES_QUERY_PERIOD;
      //now get the total
      opts.dataType ='calories';
      navigator.health.queryAggregated(opts, function(retval){
        //and remove the basal
        retval.value -= basal_ms * (retval.endDate.getTime() - retval.startDate.getTime());
        onSuccess(retval);
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
};

Health.prototype.store = function (data, onSuccess, onError) {
  if(data.dataType =='calories.active'){
    //get the basal calories
    navigator.health.queryAggregated({
      dataType:'calories.basal',
      endDate: data.endDate,
      startDate: new Date(data.endDate.getTime() - navigator.health.BASAL_CALORIES_QUERY_PERIOD)
    }, function(basalData){
      if(data.value == 0){
        //the time window is probably too small, let's give an error, although a better approach would just increasing the time window further
        onError('No basal metabolic energy expenditure found');
        return;
      }
      var basal_ms = basalData.value / navigator.health.BASAL_CALORIES_QUERY_PERIOD;
      //add basal calories
      data.value += basal_ms * (data.endDate.getTime() - data.startDate.getTime());
      data.dataType ='calories';
      Health.prototype.store(data, onSuccess, onError);
    }, onError);
  } else {
    if(data.startDate && (typeof data.startDate == 'object'))
      data.startDate = data.startDate.getTime();
    if(data.endDate && (typeof data.endDate == 'object'))
      data.endDate = data.endDate.getTime();
    if(data.dataType =='activity'){
      data.value = navigator.health.toFitActivity(data.value);
    }
    exec(onSuccess, onError, "health", "store", [data]);
  }
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
