var exec = require("cordova/exec");

var Health = function () {
  this.name = "health";
};

Health.prototype.isAvailable = function (onSuccess, onError) {
  exec(onSuccess, onError, "health", "isAvailable");
};

Health.prototype.requestAuthorization = function (datatypes, onSuccess, onError) {
  exec(onSuccess, onError, "health", "requestAuthorization", [datatypes]);
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
  }, onError, "health", "query", [opts]);
};

Health.prototype.store = function (data, onSuccess, onError) {
  if(data.startDate)
  data.startDate = data.startDate.getTime();
  if(data.endDate)
  data.endDate = data.endDate.getTime();
  if(data.dataType =='activity'){
    data.value = navigator.health.toFitActivity(data.value);
  }
  exec(onSuccess, onError, "health", "store", [data]);
};

Health.prototype.toFitActivity = function(act){
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
