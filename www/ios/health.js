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
dataTypes['gender'] = 'HKCharacteristicTypeIdentifierBiologicalSex';
dataTypes['date_of_birth'] = 'HKCharacteristicTypeIdentifierDateOfBirth';


var units = [];
units['steps'] = 'count';
units['distance'] = 'm';
units['calories'] = 'kcal';
units['height'] = 'm';
units['weight'] = 'kg';
units['heart_rate'] = 'bpm';
units['fat_percentage'] = 'percent';
units['gender'] = undefined;
units['date_of_birth'] = undefined;


Health.prototype.requestAuthorization = function (dts, onSuccess, onError) {
  var HKdatatypes = [];
  for(var i=0; i<dts.length; i++){
    if(dataTypes[ dts[i] ]){
      HKdatatypes.push(dataTypes[dts[i]]);
    } else {
      onError('unknown data type '+dts[i]);
      return;
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
  if(dataTypes[ opts.dataType ]){
    var opts = {
      'startDate': opts.startDate.getTime(),
      'endDate': opts.endDate.getTime(),
      'sampleType': dataTypes[ opts.dataType ]
    };
    if(units[ opts.dataType ]){
      opts.unit = units[ opts.dataType ];
    }
    window.plugins.healthkit.querySampleType(opts, function(data){
      var result = [];
      for(var i=0; i<data.length; i++){
        var res = {};
        res.startDate = new Date(data[i].startDate);
        res.endDate = new Date(data[i].endDate);
        res.value = data[i].quantity;
        res.unit = data[i].unit;
        res.source = data[i].sourceBundleId +'.'+ data[i].sourceName;
        result.push(res);
      }
      onSuccess(result)
    },onError);
  } else {
    onError('unknown data type '+dts[i]);
    return;
  }
};

Health.prototype.store = function (data, onSuccess, onError) {
  //TBD
};

navigator.health = new Health();
