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
          res.value = fromHKActivity(data[i].activityType);
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

    data.activityType = toHKActivity(data.value);
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

Health.prototype.toHKActivity = function(act){
  switch(act){
    case 'aerobics': return 'HKWorkoutActivityTypeOther';
    case 'archery': return 'HKWorkoutActivityTypeArchery';
    case 'badminton': return 'HKWorkoutActivityTypeBadminton';
    case 'baseball': return 'HKWorkoutActivityTypeBaseball';
    case 'basketball': return 'HKWorkoutActivityTypeBasketball';
    case 'biathlon': return 'HKWorkoutActivityTypeOther';
    case 'biking': return 'HKWorkoutActivityTypeCycling';
    case 'biking.hand': return 'HKWorkoutActivityTypeCycling';
    case 'biking.mountain': return 'HKWorkoutActivityTypeCycling';
    case 'biking.road': return 'HKWorkoutActivityTypeCycling';
    case 'biking.spinning': return 'HKWorkoutActivityTypeCycling';
    case 'biking.stationary': return 'HKWorkoutActivityTypeCycling';
    case 'biking.utility': return 'HKWorkoutActivityTypeCycling';
    case 'bowling': return 'HKWorkoutActivityTypeBowling';
    case 'boxing': return 'HKWorkoutActivityTypeOther';
    case 'calisthenics': return 'HKWorkoutActivityTypeOther';
    case 'circuit_training': return 'HKWorkoutActivityTypeOther';
    case 'cricket': return 'HKWorkoutActivityTypeCricket';
    case 'crossfit': return 'HKWorkoutActivityTypeCrossTraining';
    case 'curling': return 'HKWorkoutActivityTypeCurling';
    case 'dancing': return 'HKWorkoutActivityTypeDance';
    case 'dance_inspired': return 'HKWorkoutActivityTypeDanceInspiredTraining';
    case 'diving': return 'HKWorkoutActivityTypeOther';
    case 'elevator': return 'HKWorkoutActivityTypeOther';
    case 'elliptical': return 'HKWorkoutActivityTypeElliptical';
    case 'ergometer': return 'HKWorkoutActivityTypeOther';
    case 'escalator': return 'HKWorkoutActivityTypeOther';
    case 'fencing': return 'HKWorkoutActivityTypeFencing';
    case 'fishing': return 'HKWorkoutActivityTypeFishing';
    case 'football.american': return 'KWorkoutActivityTypeAmericanFootball';
    case 'football.australian': return 'HKWorkoutActivityTypeAustralianFootball';
    case 'football.soccer': return 'HKWorkoutActivityTypeSoccer';
    case 'frisbee_disc': return 'HKWorkoutActivityTypeOther';
    case 'functional_strength': return 'HKWorkoutActivityTypeFunctionalStrengthTraining';
    case 'gardening': return 'HKWorkoutActivityTypeOther';
    case 'golf': return 'HKWorkoutActivityTypeGolf';
    case 'gymnastics': return 'HKWorkoutActivityTypeGymnastics';
    case 'handball': return 'HKWorkoutActivityTypeHandball';
    case 'interval_training.high_intensity': return 'HKWorkoutActivityTypeOther';
    case 'hiking': return 'HKWorkoutActivityTypeHiking';
    case 'hockey': return 'HKWorkoutActivityTypeHockey';
    case 'horseback_riding': return 'HKWorkoutActivityTypeEquestrianSports';
    case 'housework': return 'HKWorkoutActivityTypeOther';
    case 'hunting': return 'HKWorkoutActivityTypeHunting';
    case 'ice_skating': return 'HKWorkoutActivityTypeOther';
    case 'in_vehicle': return 'HKWorkoutActivityTypeOther';
    case 'interval_training': return 'HKWorkoutActivityTypeOther';
    case 'jump_rope': return 'HKWorkoutActivityTypeOther';
    case 'kayaking': return 'HKWorkoutActivityTypeOther';
    case 'kettlebell_training': return 'HKWorkoutActivityTypeOther';
    case 'kick_scooter': return 'HKWorkoutActivityTypeOther';
    case 'kickboxing': return 'HKWorkoutActivityTypeOther';
    case 'kitesurfing': return 'HKWorkoutActivityTypeMartialArts';
    case 'lacrosse': return 'HKWorkoutActivityTypeLacrosse';
    case 'martial_arts': return 'HKWorkoutActivityTypeOther';
    case 'meditation': return 'HKWorkoutActivityTypeMindAndBody';
    case 'martial_arts.mixed': return 'HKWorkoutActivityTypeOther';
    case 'on_foot': return 'HKWorkoutActivityTypeOther';
    case 'mixed_metabolic_cardio': return 'HKWorkoutActivityTypeMixedMetabolicCardioTraining';
    case 'other': return 'HKWorkoutActivityTypeOther';
    case 'p90x': return 'HKWorkoutActivityTypeOther';
    case 'paddle_sports': return 'HKWorkoutActivityTypePaddleSports';
    case 'paragliding': return 'HKWorkoutActivityTypeOther';
    case 'pilates': return 'HKWorkoutActivityTypeOther';
    case 'play': return 'HKWorkoutActivityTypePlay';
    case 'polo': return 'HKWorkoutActivityTypeOther';
    case 'preparation_and_recovery': return 'HKWorkoutActivityTypePreparationAndRecovery';
    case 'racquetball': return 'HKWorkoutActivityTypeRacquetball';
    case 'rock_climbing': return 'HKWorkoutActivityTypeClimbing';
    case 'rowing': return 'HKWorkoutActivityTypeRowing';
    case 'rowing.machine': return 'HKWorkoutActivityTypeRowing';
    case 'rugby': return 'HKWorkoutActivityTypeRugby';
    case 'running': return 'HKWorkoutActivityTypeRunning';
    case 'running.jogging': return 'HKWorkoutActivityTypeRunning';
    case 'running.sand': return 'HKWorkoutActivityTypeRunning';
    case 'running.treadmill': return 'HKWorkoutActivityTypeRunning';
    case 'sailing': return 'HKWorkoutActivityTypeSailing';
    case 'scuba_diving': return 'HKWorkoutActivityTypeOther';
    case 'skateboarding': return 'HKWorkoutActivityTypeOther';
    case 'skating': return 'HKWorkoutActivityTypeSkatingSports';
    case 'skating.cross': return 'HKWorkoutActivityTypeSkatingSports';
    case 'skating.indoor': return 'HKWorkoutActivityTypeSkatingSports';
    case 'skating.inline': return 'HKWorkoutActivityTypeSkatingSports';
    case 'skiing': return 'HKWorkoutActivityTypeSnowSports';
    case 'skiing.back_country': return 'HKWorkoutActivityTypeSnowSports';
    case 'skiing.cross_country': return 'HKWorkoutActivityTypeSnowSports';
    case 'skiing.downhill': return 'HKWorkoutActivityTypeSnowSports';
    case 'skiing.kite': return 'HKWorkoutActivityTypeSnowSports';
    case 'skiing.roller': return 'HKWorkoutActivityTypeSnowSports';
    case 'sledding': return 'HKWorkoutActivityTypeSnowSports';
    case 'snowboarding': return 'HKWorkoutActivityTypeSnowSports';
    case 'snowmobile': return 'HKWorkoutActivityTypeSnowSports';
    case 'snowshoeing': return 'HKWorkoutActivityTypeSnowSports';
    case 'snow_sports': return 'HKWorkoutActivityTypeSnowSports';
    case 'softball': return 'HKWorkoutActivityTypeSoftball';
    case 'squash': return 'HKWorkoutActivityTypeSquash';
    case 'stair_climbing': return 'HKWorkoutActivityTypeStairClimbing';
    case 'stair_climbing.machine': return 'HKWorkoutActivityTypeStairClimbing';
    case 'standup_paddleboarding': return 'HKWorkoutActivityTypePaddleSports';
    case 'still': return 'HKWorkoutActivityTypeOther';
    case 'strength_training': return 'HKWorkoutActivityTypeTraditionalStrengthTraining';
    case 'surfing': return 'HKWorkoutActivityTypeSurfingSports';
    case 'swimming': return 'HKWorkoutActivityTypeSwimming';
    case 'swimming.pool': return 'HKWorkoutActivityTypeSwimming';
    case 'swimming.open_water': return 'HKWorkoutActivityTypeSwimming';
    case 'table_tennis': return 'HKWorkoutActivityTypeTableTennis';
    case 'team_sports': return 'HKWorkoutActivityTypeOther';
    case 'tennis': return 'HKWorkoutActivityTypeTennis';
    case 'tilting': return 'HKWorkoutActivityTypeOther';
    case 'track_and_field': return 'HKWorkoutActivityTypeTrackAndField';
    case 'treadmill': return 'HKWorkoutActivityTypeOther';
    case 'unknown': return 'HKWorkoutActivityTypeOther';
    case 'volleyball': return 'HKWorkoutActivityTypeVolleyball';
    case 'volleyball.beach': return 'HKWorkoutActivityTypeVolleyball';
    case 'volleyball.indoor': return 'HKWorkoutActivityTypeVolleyball';
    case 'wakeboarding': return 'HKWorkoutActivityTypeOther';
    case 'walking': return 'HKWorkoutActivityTypeWalking';
    case 'walking.fitness': return 'HKWorkoutActivityTypeWalking';
    case 'walking.nordic': return 'HKWorkoutActivityTypeWalking';
    case 'walking.treadmill': return 'HKWorkoutActivityTypeWalking';
    case 'walking.stroller': return 'HKWorkoutActivityTypeWalking';
    case 'water_fitness': return 'HKWorkoutActivityTypeWaterFitness';
    case 'water_polo': return 'HKWorkoutActivityTypeWaterPolo';
    case 'water_sports': return 'HKWorkoutActivityTypeWaterSports';
    case 'weightlifting': return 'HKWorkoutActivityTypeOther';
    case 'wheelchair': return 'HKWorkoutActivityTypeOther';
    case 'windsurfing': return 'HKWorkoutActivityTypeOther';
    case 'wrestling': return 'HKWorkoutActivityTypeWrestling';
    case 'yoga': return 'HKWorkoutActivityTypeYoga';
    case 'zumba': return 'HKWorkoutActivityTypeOther';
    default: return 'HKWorkoutActivityTypeOther';
  }
};

Health.prototype.fromHKActivity = function(act){
  switch(act){
    case 'HKWorkoutActivityTypeArchery': return 'archery';
    case 'HKWorkoutActivityTypeBadminton': return 'badminton';
    case 'HKWorkoutActivityTypeBaseball': return 'baseball';
    case 'HKWorkoutActivityTypeBasketball': return 'basketball';
    case 'HKWorkoutActivityTypeCycling': return 'biking';
    case 'HKWorkoutActivityTypeCycling': return 'biking.hand';
    case 'HKWorkoutActivityTypeCycling': return 'biking.mountain';
    case 'HKWorkoutActivityTypeCycling': return 'biking.road';
    case 'HKWorkoutActivityTypeCycling': return 'biking.spinning';
    case 'HKWorkoutActivityTypeCycling': return 'biking.stationary';
    case 'HKWorkoutActivityTypeCycling': return 'biking.utility';
    case 'HKWorkoutActivityTypeBowling': return 'bowling';
    case 'HKWorkoutActivityTypeCricket': return 'cricket';
    case 'HKWorkoutActivityTypeCrossTraining': return 'crossfit';
    case 'HKWorkoutActivityTypeCurling': return 'curling';
    case 'HKWorkoutActivityTypeDance': return 'dancing';
    case 'HKWorkoutActivityTypeDanceInspiredTraining': return 'dance_inspired';
    case 'HKWorkoutActivityTypeElliptical': return 'elliptical';
    case 'HKWorkoutActivityTypeFencing': return 'fencing';
    case 'HKWorkoutActivityTypeFishing': return 'fishing';
    case 'KWorkoutActivityTypeAmericanFootball': return 'football.american';
    case 'HKWorkoutActivityTypeAustralianFootball': return 'football.australian';
    case 'HKWorkoutActivityTypeSoccer': return 'football.soccer';
    case 'HKWorkoutActivityTypeFunctionalStrengthTraining': return 'functional_strength';
    case 'HKWorkoutActivityTypeGolf': return 'golf';
    case 'HKWorkoutActivityTypeGymnastics': return 'gymnastics';
    case 'HKWorkoutActivityTypeHandball': return 'handball';
    case 'HKWorkoutActivityTypeHiking': return 'hiking';
    case 'HKWorkoutActivityTypeHockey': return 'hockey';
    case 'HKWorkoutActivityTypeEquestrianSports': return 'horseback_riding';
    case 'HKWorkoutActivityTypeHunting': return 'hunting';
    case 'HKWorkoutActivityTypeMartialArts': return 'kitesurfing';
    case 'HKWorkoutActivityTypeLacrosse': return 'lacrosse';
    case 'HKWorkoutActivityTypeMindAndBody': return 'meditation';
    case 'HKWorkoutActivityTypeMixedMetabolicCardioTraining': return 'mixed_metabolic_cardio';
    case 'HKWorkoutActivityTypeOther': return 'other';
    case 'HKWorkoutActivityTypePaddleSports': return 'paddle_sports';
    case 'HKWorkoutActivityTypePlay': return 'play';
    case 'HKWorkoutActivityTypePreparationAndRecovery': return 'preparation_and_recovery';
    case 'HKWorkoutActivityTypeRacquetball': return 'racquetball';
    case 'HKWorkoutActivityTypeClimbing': return 'rock_climbing';
    case 'HKWorkoutActivityTypeRowing': return 'rowing';
    case 'HKWorkoutActivityTypeRowing': return 'rowing.machine';
    case 'HKWorkoutActivityTypeRugby': return 'rugby';
    case 'HKWorkoutActivityTypeRunning': return 'running';
    case 'HKWorkoutActivityTypeRunning': return 'running.jogging';
    case 'HKWorkoutActivityTypeRunning': return 'running.sand';
    case 'HKWorkoutActivityTypeRunning': return 'running.treadmill';
    case 'HKWorkoutActivityTypeSailing': return 'sailing';
    case 'HKWorkoutActivityTypeSkatingSports': return 'skating';
    case 'HKWorkoutActivityTypeSkatingSports': return 'skating.cross';
    case 'HKWorkoutActivityTypeSkatingSports': return 'skating.indoor';
    case 'HKWorkoutActivityTypeSkatingSports': return 'skating.inline';
    case 'HKWorkoutActivityTypeSnowSports': return 'skiing';
    case 'HKWorkoutActivityTypeSnowSports': return 'skiing.back_country';
    case 'HKWorkoutActivityTypeSnowSports': return 'skiing.cross_country';
    case 'HKWorkoutActivityTypeSnowSports': return 'skiing.downhill';
    case 'HKWorkoutActivityTypeSnowSports': return 'skiing.kite';
    case 'HKWorkoutActivityTypeSnowSports': return 'skiing.roller';
    case 'HKWorkoutActivityTypeSnowSports': return 'sledding';
    case 'HKWorkoutActivityTypeSnowSports': return 'snowboarding';
    case 'HKWorkoutActivityTypeSnowSports': return 'snowmobile';
    case 'HKWorkoutActivityTypeSnowSports': return 'snowshoeing';
    case 'HKWorkoutActivityTypeSnowSports': return 'snow_sports';
    case 'HKWorkoutActivityTypeSoftball': return 'softball';
    case 'HKWorkoutActivityTypeSquash': return 'squash';
    case 'HKWorkoutActivityTypeStairClimbing': return 'stair_climbing';
    case 'HKWorkoutActivityTypeStairClimbing': return 'stair_climbing.machine';
    case 'HKWorkoutActivityTypePaddleSports': return 'standup_paddleboarding';
    case 'HKWorkoutActivityTypeTraditionalStrengthTraining': return 'strength_training';
    case 'HKWorkoutActivityTypeSurfingSports': return 'surfing';
    case 'HKWorkoutActivityTypeSwimming': return 'swimming';
    case 'HKWorkoutActivityTypeSwimming': return 'swimming.pool';
    case 'HKWorkoutActivityTypeSwimming': return 'swimming.open_water';
    case 'HKWorkoutActivityTypeTableTennis': return 'table_tennis';
    case 'HKWorkoutActivityTypeTennis': return 'tennis';
    case 'HKWorkoutActivityTypeTrackAndField': return 'track_and_field';
    case 'HKWorkoutActivityTypeVolleyball': return 'volleyball';
    case 'HKWorkoutActivityTypeVolleyball': return 'volleyball.beach';
    case 'HKWorkoutActivityTypeVolleyball': return 'volleyball.indoor';
    case 'HKWorkoutActivityTypeWalking': return 'walking';
    case 'HKWorkoutActivityTypeWalking': return 'walking.fitness';
    case 'HKWorkoutActivityTypeWalking': return 'walking.nordic';
    case 'HKWorkoutActivityTypeWalking': return 'walking.treadmill';
    case 'HKWorkoutActivityTypeWalking': return 'walking.stroller';
    case 'HKWorkoutActivityTypeWaterFitness': return 'water_fitness';
    case 'HKWorkoutActivityTypeWaterPolo': return 'water_polo';
    case 'HKWorkoutActivityTypeWaterSports': return 'water_sports';
    case 'HKWorkoutActivityTypeWrestling': return 'wrestling';
    case 'HKWorkoutActivityTypeYoga': return 'yoga';
    default: return 'other';
  }
};

cordova.addConstructor(function(){
  navigator.health = new Health();
  return navigator.health;
});
