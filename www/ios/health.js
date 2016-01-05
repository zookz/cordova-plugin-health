var exec = require("cordova/exec");

var Health = function () {
  this.name = "health";
};

var dataTypes = [];
dataTypes['steps'] = 'HKQuantityTypeIdentifierStepCount';
dataTypes['distance'] = 'HKQuantityTypeIdentifierDistanceWalkingRunning';
dataTypes['calories'] = 'HKQuantityTypeIdentifierActiveEnergyBurned';
dataTypes['height'] = 'HKQuantityTypeIdentifierHeight';
dataTypes['weight'] = 'HKQuantityTypeIdentifierBodyMass';
dataTypes['heart_rate'] = 'HKQuantityTypeIdentifierHeartRate';
dataTypes['fat_percentage'] = 'HKQuantityTypeIdentifierBodyFatPercentage';
dataTypes['activity'] = 'HKWorkoutTypeIdentifier';


var units = [];
units['steps'] = 'count';
units['distance'] = 'm';
units['calories'] = 'kcal';
units['height'] = 'm';
units['weight'] = 'kg';
units['heart_rate'] = 'count/min';
units['fat_percentage'] = '%';


Health.prototype.requestAuthorization = function (dts, onSuccess, onError) {
  var HKdatatypes = [];
  for(var i=0; i<dts.length; i++){
    if((dts[i] != 'gender') && (dts[i] != 'date_of_birth')){//ignore gender and dob
      if(dataTypes[ dts[i] ]){
        HKdatatypes.push(dataTypes[dts[i]]);
      } else {
        onError('unknown data type '+dts[i]);
        return;
      }
    }
  }
  if(HKdatatypes.length){
    window.plugins.healthkit.requestAuthorization( {
      'readTypes': HKdatatypes,
      'writeTypes': HKdatatypes
    }, onSuccess, onError);
  } else onSuccess();
};

Health.prototype.query = function (opts, onSuccess, onError) {

  //from http://stackoverflow.com/questions/6704325/how-to-convert-date-in-format-yyyy-mm-dd-hhmmss-to-unix-timestamp
  var convertDate = function(d){
    var match = d.match(/^(\d+)-(\d+)-(\d+) (\d+)\:(\d+)\:(\d+)$/)
    return new Date(match[1], match[2] - 1, match[3], match[4], match[5], match[6]);
  };

  if(opts.dataType== 'gender'){
    window.plugins.healthkit.readGender(function(data){
      var res = [];
      res[0]= {
        startDate: opts.startDate,
        endDate: opts.endDate,
        value: data,
        source: "com.apple.Health"
      };
      onSuccess(res);
    }, onError);
  } else if(opts.dataType== 'date_of_birth'){
    window.plugins.healthkit.readDateOfBirth(function(data){
      data.startDate = opts.startDate;
      data.endDate = opts.endDate;
      var res = [];
      var date = new Date(data);
      res[0]= {
        startDate: opts.startDate,
        endDate: opts.endDate,
        value: { day: date.getDate(), month: date.getMonth()+1, year: date.getFullYear()},
        source: "Health"
      };
      onSuccess(res);
    }, onError);
  }  else if(opts.dataType== 'activity') {
    //opts is not really used, the plugin just returns ALL workouts !!!
    window.plugins.healthkit.findWorkouts(opts, function(data){
      var result = [];
      for(var i=0; i<data.length; i++) {
        var res = {};
        res.startDate = convertDate(data[i].startDate);
        res.endDate = convertDate(data[i].endDate);
        //filter the results based on the dates
        if((res.startDate >= opts.startDate) && (res.endDate <=opts.endDate)) {
          res.value = data[i].activityType;
          res.unit = 'activityType';
          res.source = data[i].sourceName;
          result.push(res);
        }
      }
      //TODO: add sleep analysis
      onSuccess(result);
    }, onError);
  } else if(dataTypes[ opts.dataType ]){
    opts.sampleType = dataTypes[ opts.dataType ];
    if(units[ opts.dataType ]){
      opts.unit = units[ opts.dataType ];
    }
    window.plugins.healthkit.querySampleType(opts, function(data){
      if((opts.dataType== 'weight') && (data.length == 0)){
        //let's try to get it from the health ID
        window.plugins.healthkit.readWeight({ unit: 'kg' }, function(data){
          var res = [];
          res[0]= {
            startDate: convertDate(data.date),
            endDate: convertDate(data.date),
            value: data.value,
            unit: data.unit,
            source: "Health"
          };
          onSuccess(res);
        }, onError);
      } else if((opts.dataType== 'height') && (data.length == 0)){
        //let's try to get it from the health ID
        window.plugins.healthkit.readHeight({ unit: 'm' }, function(data){
          var res = [];
          res[0]= {
            startDate: convertDate(data.date),
            endDate: convertDate(data.date),
            value: data.value,
            unit: data.unit,
            source: "Health"
          };
          onSuccess(res);
        }, onError);
      } else {
        var result = [];
        for(var i=0; i<data.length; i++) {
          var res = {};
          res.startDate = convertDate(data[i].startDate);
          res.endDate = convertDate(data[i].endDate);
          res.value = data[i].quantity;
          if(data[i].unit) res.unit = data[i].unit;
          if(opts.unit) res.unit = opts.unit;
          res.source = data[i].sourceName;
          result.push(res);
        }
        onSuccess(result);
      }
    },onError);
  } else {
    onError('unknown data type '+dts[i]);
  }
};

Health.prototype.store = function (data, onSuccess, onError) {
  if(data.dataType== 'gender'){
    onError('Gender is not writeable');
  } else if(data.dataType== 'date_of_birth'){
    onError('Date of birth is not writeable');
  } else if(data.dataType == 'activity'){
    //TODO: add sleep

    data.activityType = data.value;
    //TODO: add energy (energyUnit: 'kcal') and distance (distanceUnit: 'km' )
    window.plugins.healthkit.saveWorkout(data, onSuccess, onError);
  } else if(dataTypes[ data.dataType ]){
    data.sampleType = dataTypes[ data.dataType ];
    data.amount = data.value;
    if(units[ data.dataType ]){
      data.unit = units[ data.dataType ];
    }
    window.plugins.healthkit.saveQuantitySample(data, onSuccess, onError);
  } else {
    onError('unknown data type '+dts[i]);
  }
};


cordova.addConstructor(function(){
  navigator.health = new Health();
  return navigator.health;
});
