var exec = require("cordova/exec");

var Health = function () {
  this.name = "health";
};

var dataTypes = [];
dataTypes['steps'] = 'HKQuantityTypeIdentifierStepCount';
dataTypes['distance'] = 'HKQuantityTypeIdentifierDistanceWalkingRunning'; //and HKQuantityTypeIdentifierDistanceCycling
dataTypes['calories.active'] = 'HKQuantityTypeIdentifierActiveEnergyBurned';
dataTypes['calories.basal'] = 'HKQuantityTypeIdentifierBasalEnergyBurned';
dataTypes['height'] = 'HKQuantityTypeIdentifierHeight';
dataTypes['weight'] = 'HKQuantityTypeIdentifierBodyMass';
dataTypes['heart_rate'] = 'HKQuantityTypeIdentifierHeartRate';
dataTypes['fat_percentage'] = 'HKQuantityTypeIdentifierBodyFatPercentage';
dataTypes['activity'] = 'HKWorkoutTypeIdentifier'; //and HKCategoryTypeIdentifierSleepAnalysis


var units = [];
units['steps'] = 'count';
units['distance'] = 'm';
units['calories.active'] = 'kcal';
units['calories.basal'] = 'kcal';
units['height'] = 'm';
units['weight'] = 'kg';
units['heart_rate'] = 'count/min';
units['fat_percentage'] = '%';

Health.prototype.isAvailable = function(success, error){
  window.plugins.healthkit.available(success, error);
};

Health.prototype.requestAuthorization = function (dts, onSuccess, onError) {
  var HKdatatypes = [];
  for(var i=0; i<dts.length; i++){
    if((dts[i] != 'gender') && (dts[i] != 'date_of_birth')){//ignore gender and DOB
      if(dataTypes[dts[i]]){
        HKdatatypes.push(dataTypes[dts[i]]);
        if(dts[i] == 'distance')
        HKdatatypes.push('HKQuantityTypeIdentifierDistanceCycling');
        if(dts[i] == 'activity')
        HKdatatypes.push('HKCategoryTypeIdentifierSleepAnalysis');
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
  var startD = opts.startDate;
  var endD = opts.endDate;

  //from http://stackoverflow.com/questions/6704325/how-to-convert-date-in-format-yyyy-mm-dd-hhmmss-to-unix-timestamp
  var convertDate = function(d){
    var match = d.match(/^(\d+)-(\d+)-(\d+) (\d+)\:(\d+)\:(\d+)$/)
    return new Date(match[1], match[2] - 1, match[3], match[4], match[5], match[6]);
  };

  if(opts.dataType== 'gender'){
    window.plugins.healthkit.readGender(function(data){
      var res = [];
      res[0]= {
        startDate: startD,
        endDate: endD,
        value: data,
        source: "com.apple.Health"
      };
      onSuccess(res);
    }, onError);
  } else if(opts.dataType== 'date_of_birth'){
    window.plugins.healthkit.readDateOfBirth(function(data){
      data.startDate = startD;
      data.endDate = endD;
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
  } else if(opts.dataType== 'activity') {
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
          res.calories = data[i].energy;
          res.distance = data[i].distance;
          res.source = data[i].sourceName;
          result.push(res);
        }
      }
      //get sleep analysis also
      opts.sampleType = 'HKCategoryTypeIdentifierSleepAnalysis';
      window.plugins.healthkit.querySampleType(opts, function(data){
        for(var i=0; i<data.length; i++) {
          var res = {};
          res.startDate = convertDate(data[i].startDate);
          res.endDate = convertDate(data[i].endDate);
          if(data[i].value == 0) res.value = 'sleep.awake';
          else res.value = 'sleep';
          res.unit = 'activityType';
          res.source = data[i].sourceName;
          result.push(res);
        }
        onSuccess(result);
      }, onError);
    }, onError);
  } else if(dataTypes[ opts.dataType ]){
    opts.sampleType = dataTypes[ opts.dataType ];
    if(units[ opts.dataType ]){
      opts.unit = units[ opts.dataType ];
    }
    window.plugins.healthkit.querySampleType(opts, function(data){
      var result = [];
      //fallback scenario for weight
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
          return;
        }, onError);
      }
      //fallback scenario for height
      else if((opts.dataType== 'height') && (data.length == 0)){
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
          return;
        }, onError);
      } else {
        var convertSamples = function(samples){
          for(var i=0; i<samples.length; i++) {
            var res = {};
            res.startDate = convertDate(samples[i].startDate);
            res.endDate = convertDate(samples[i].endDate);
            res.value = samples[i].quantity;
            if(data[i].unit) res.unit = samples[i].unit;
            else if(opts.unit) res.unit = opts.unit;
            res.source = samples[i].sourceName;
            result.push(res);
          }
        };
        convertSamples(data);
        if(opts.dataType== 'distance'){//in the case of the distance, add the cycling distances
          opts.sampleType = 'HKQuantityTypeIdentifierDistanceCycling';
          //reassing start and end times
          opts.startDate = startD;
          opts.endDate = endD;
          window.plugins.healthkit.querySampleType(opts, function(data){
            convertSamples(data);
            onSuccess(result);
          }, onError);
        } else onSuccess(result);
      }
    }, onError);//first call to querySampleType
  } else {
    onError('unknown data type '+dts[i]);
  }
};


Health.prototype.queryAggregated = function (opts, onSuccess, onError) {
  var startD = opts.startDate;
  var endD = opts.endDate;
  if((opts.dataType == 'steps') || (opts.dataType == 'distance') || (opts.dataType == 'calories.active') || (opts.dataType == 'calories.basal')){
    opts.sampleType = dataTypes[ opts.dataType ];
    if(units[ opts.dataType ]) opts.unit = units[ opts.dataType ];
    window.plugins.healthkit.sumQuantityType(opts, function(value) {
      if(opts.dataType == 'distance'){
        //add HKQuantityTypeIdentifierDistanceCycling to distance
        var dist = value;
        opts.startDate = startD;
        opts.endDate = endD;
        window.plugins.healthkit.sumQuantityType(opts, function(value) {
          onSuccess({
            startDate: startD,
            endDate: endD,
            value: value + dist,
            unit: opts.unit
          });
        }, onError);
      } else {
        onSuccess({
          startDate: startD,
          endDate: endD,
          value: value,
          unit: opts.unit
        });
      }
    }, onError);
  } else if(opts.dataType == 'activity'){
    var res = {
      startDate: startD,
      endDate: endD,
      value: {},
      unit: 'activitySummary'
    };
    navigator.health.query(opts, function(data){
      //aggregate by activity
      for(var i=0; i<data.length; i++){
        var dur = (data[i].endDate - data[i].startDate);
        var dist = data[i].distance;
        var cals = data[i].calories;
        if(res.value[data[i].value]){
          res.value[data[i].value].duration += dur;
          res.value[data[i].value].distance += dist;
          res.value[data[i].value].calories += cals;
        } else res.value[data[i].value] = {
          duration: dur,
          distance: dist,
          calories: cals
        };
      }
      onSuccess(res);
    }, onError);
  } else {
    onError('Datatype '+opts.dataType+' not supported in queryAggregated');
  }
};

Health.prototype.store = function (data, onSuccess, onError) {
  if(data.dataType == 'gender'){
    onError('Gender is not writeable');
  } else if(data.dataType== 'date_of_birth'){
    onError('Date of birth is not writeable');
  } else if(data.dataType == 'activity'){
    if((data.value == 'sleep') ||
    (data.value == 'sleep.light') ||
    (data.value == 'sleep.deep') ||
    (data.value == 'sleep.rem')){
      data.sampleType = 'HKCategoryTypeIdentifierSleepAnalysis'
      data.amount = 1;//amount or value??
      window.plugins.healthkit.saveQuantitySample(data, onSuccess, onError);
    } else if(data.value == 'sleep.awake'){
      data.sampleType = 'HKCategoryTypeIdentifierSleepAnalysis'
      data.amount = 0;//amount or value??
      window.plugins.healthkit.saveQuantitySample(data, onSuccess, onError);
    } else {
      data.activityType = data.value;
      //TODO: add energy (energyUnit: 'kcal') and distance (distanceUnit: 'km' )
      window.plugins.healthkit.saveWorkout(data, onSuccess, onError);
    }
  } else if(dataTypes[ data.dataType ]){
    data.sampleType = dataTypes[ data.dataType ];
    if((data.dataType == 'distance') && data.cycling){
      data.sampleType = 'HKQuantityTypeIdentifierDistanceCycling';
    }
    data.amount = data.value;
    if(units[ data.dataType ]){
      data.unit = units[ data.dataType ];
    }
    window.plugins.healthkit.saveQuantitySample(data, onSuccess, onError);
  } else {
    onError('unknown data type '+data.dataType);
  }
};


cordova.addConstructor(function(){
  navigator.health = new Health();
  return navigator.health;
});
