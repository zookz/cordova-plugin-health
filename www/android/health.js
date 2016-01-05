var exec = require("cordova/exec");

var Health = function () {
  this.name = "health";
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
    data.value = Health.toFitActivity(data.value);
  }
  exec(onSuccess, onError, "health", "store", [data]);
};

Health.prototype.toFitActivity = function(act){
  switch(act){
    case 'aerobics': return 'aerobics';
    case 'archery': return 'other';
    case 'badminton': return 'badminton';
    case 'baseball': return 'baseball';
    case 'basketball': return 'basketball';
    case 'biathlon': return 'biathlon';
    case 'biking': return 'biking';
    case 'biking.hand': return 'biking.hand';
    case 'biking.mountain': return 'biking.mountain';
    case 'biking.road': return 'biking.road';
    case 'biking.spinning': return 'biking.spinning';
    case 'biking.stationary': return 'biking.stationary';
    case 'biking.utility': return 'biking.utility';
    case 'bowling': return 'other';
    case 'boxing': return 'boxing';
    case 'calisthenics': return 'calisthenics';
    case 'circuit_training': return 'circuit_training';
    case 'cricket': return 'cricket';
    case 'crossfit': return 'crossfit';
    case 'curling': return 'curling';
    case 'dancing': return 'dancing';
    case 'dance_inspired': return 'dance_inspired';
    case 'diving': return 'diving';
    case 'elevator': return 'elevator';
    case 'elliptical': return 'elliptical';
    case 'ergometer': return 'ergometer';
    case 'escalator': return 'escalator';
    case 'fencing': return 'fencing';
    case 'fishing': return 'other';
    case 'football.american': return 'football.american';
    case 'football.australian': return 'football.australian';
    case 'football.soccer': return 'football.soccer';
    case 'frisbee_disc': return 'frisbee_disc';
    case 'functional_strength': return 'other';
    case 'gardening': return 'gardening';
    case 'golf': return 'golf';
    case 'gymnastics': return 'gymnastics';
    case 'handball': return 'handball';
    case 'interval_training.high_intensity': return 'interval_training.high_intensity';
    case 'hiking': return 'hiking';
    case 'hockey': return 'hockey';
    case 'horseback_riding': return 'horseback_riding';
    case 'housework': return 'housework';
    case 'hunting': return 'other';
    case 'ice_skating': return 'ice_skating';
    case 'in_vehicle': return 'in_vehicle';
    case 'interval_training': return 'interval_training';
    case 'jump_rope': return 'jump_rope';
    case 'kayaking': return 'kayaking';
    case 'kettlebell_training': return 'kettlebell_training';
    case 'kick_scooter': return 'kick_scooter';
    case 'kickboxing': return 'kickboxing';
    case 'kitesurfing': return 'kitesurfing';
    case 'lacrosse': return 'other';
    case 'martial_arts': return 'martial_arts';
    case 'meditation': return 'meditation';
    case 'martial_arts.mixed': return 'martial_arts.mixed';
    case 'on_foot': return 'on_foot';
    case 'mixed_metabolic_cardio': return 'other';
    case 'other': return 'other';
    case 'p90x': return 'p90x';
    case 'paddle_sports': return 'other';
    case 'paragliding': return 'paragliding';
    case 'pilates': return 'pilates';
    case 'play': return 'other';
    case 'polo': return 'polo';
    case 'preparation_and_recovery': return 'other';
    case 'racquetball': return 'racquetball';
    case 'rock_climbing': return 'rock_climbing';
    case 'rowing': return 'rowing';
    case 'rowing.machine': return 'rowing.machine';
    case 'rugby': return 'rugby';
    case 'running': return 'running';
    case 'running.jogging': return 'running.jogging';
    case 'running.sand': return 'running.sand';
    case 'running.treadmill': return 'running.treadmill';
    case 'sailing': return 'sailing';
    case 'scuba_diving': return 'scuba_diving';
    case 'skateboarding': return 'skateboarding';
    case 'skating': return 'skating';
    case 'skating.cross': return 'skating.cross';
    case 'skating.indoor': return 'skating.indoor';
    case 'skating.inline': return 'skating.inline';
    case 'skiing': return 'skiing';
    case 'skiing.back_country': return 'skiing.back_country';
    case 'skiing.cross_country': return 'skiing.cross_country';
    case 'skiing.downhill': return 'skiing.downhill';
    case 'skiing.kite': return 'skiing.kite';
    case 'skiing.roller': return 'skiing.roller';
    case 'sledding': return 'sledding';
    case 'sleep': return 'sleep';
    case 'sleep.light': return 'sleep.light';
    case 'sleep.deep': return 'sleep.deep';
    case 'sleep.rem': return 'sleep.rem';
    case 'sleep.awake': return 'sleep.awake';
    case 'snowboarding': return 'snowboarding';
    case 'snowmobile': return 'snowmobile';
    case 'snowshoeing': return 'snowshoeing';
    case 'snow_sports': return 'other';
    case 'softball': return 'other';
    case 'squash': return 'squash';
    case 'stair_climbing': return 'stair_climbing';
    case 'stair_climbing.machine': return 'stair_climbing.machine';
    case 'standup_paddleboarding': return 'standup_paddleboarding';
    case 'still': return 'still';
    case 'strength_training': return 'strength_training';
    case 'surfing': return 'surfing';
    case 'swimming': return 'swimming';
    case 'swimming.pool': return 'swimming.pool';
    case 'swimming.open_water': return 'swimming.open_water';
    case 'table_tennis': return 'table_tennis';
    case 'team_sports': return 'team_sports';
    case 'tennis': return 'tennis';
    case 'tilting': return 'tilting';
    case 'track_and_field': return 'track_and_field';
    case 'treadmill': return 'treadmill';
    case 'unknown': return 'unknown';
    case 'volleyball': return 'volleyball';
    case 'volleyball.beach': return 'volleyball.beach';
    case 'volleyball.indoor': return 'volleyball.indoor';
    case 'wakeboarding': return 'wakeboarding';
    case 'walking': return 'walking';
    case 'walking.fitness': return 'walking.fitness';
    case 'walking.nordic': return 'walking.nordic';
    case 'walking.treadmill': return 'walking.treadmill';
    case 'walking.stroller': return 'walking.stroller';
    case 'water_fitness': return 'other';
    case 'water_polo': return 'water_polo';
    case 'water_sports': return 'other';
    case 'weightlifting': return 'weightlifting';
    case 'wheelchair': return 'wheelchair';
    case 'windsurfing': return 'windsurfing';
    case 'wrestling': return 'other';
    case 'yoga': return 'yoga';
    case 'zumba': return 'zumba';
    default: return 'other';
  }
};

cordova.addConstructor(function(){
  navigator.health = new Health();
  return navigator.health;
});
