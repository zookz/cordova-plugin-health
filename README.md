# Cordova Health Plugin


A plugin that abstracts fitness and health repositories like Apple HealthKit or Google Fit.

This work is based on [cordova plugin googlefit](https://github.com/2dvisio/cordova-plugin-googlefit) and on [cordova healthkit plugin](https://github.com/Telerik-Verified-Plugins/HealthKit)

## Warning

This plugin stores health data in Google Fit, practice that is discouraged by Google.

## Installation

Just execute this line in your project's folder:

```
cordova plugin add cordova-plugin-health
```

## Supported data types

As HealthKit does not allow adding custom data types, only a subset of data types supported by HealthKit has been chosen.
Google Fit is limited to fitness data and, for health, custom data types are defined with the suffix of the package name of your project.

| data type       |      HealthKit equivalent (unit)                        |  Google Fit equivalent                   |
|-----------------|---------------------------------------------------------|------------------------------------------|
| steps           | HKQuantityTypeIdentifierStepCount (count)               | TYPE_STEP_COUNT_DELTA                    |
| distance        | HKQuantityTypeIdentifierDistanceWalkingRunning (m) + HKQuantityTypeIdentifierDistanceCycling (m) | TYPE_DISTANCE_DELTA |
| calories.active | HKQuantityTypeIdentifierActiveEnergyBurned (kcal)       | TYPE_CALORIES_EXPENDED - (TYPE_BASAL_METABOLIC_RATE * time window) |
| calories.basal  | HKQuantityTypeIdentifierBasalEnergyBurned (kcal)        | TYPE_BASAL_METABOLIC_RATE * time window  |
| activity        | HKWorkoutTypeIdentifier + HKCategoryTypeIdentifierSleepAnalysis | TYPE_ACTIVITY_SEGMENT            |
| height          | HKQuantityTypeIdentifierHeight (m)                      | TYPE_HEIGHT                              |
| weight          | HKQuantityTypeIdentifierBodyMass (kg)                   | TYPE_WEIGHT                              |
| heart_rate      | HKQuantityTypeIdentifierHeartRate (count/min)           | TYPE_HEART_RATE_BPM                      |
| fat_percentage  | HKQuantityTypeIdentifierBodyFatPercentage (%)           | TYPE_BODY_FAT_PERCENTAGE                 |
| gender          | HKCharacteristicTypeIdentifierBiologicalSex             | custom (YOUR_PACKAGE_NAME.gender)        |
| date_of_birth   | HKCharacteristicTypeIdentifierDateOfBirth               | custom (YOUR_PACKAGE_NAME.date_of_birth) |


Note: units of measurements are fixed !

Data types can be of different types, see examples below:

| data type      | value                             |
|----------------|-----------------------------------|
| steps          | 34                                |
| distance       | 101.2                             |
| calories       | 245.3                             |
| activity       | "walking"  (note: recognised activities and their mapping to Fit / HealthKit equivalents are listed in [this file](activities_map.md)) |
| height         | 185.9                             |
| weight         | 83.3                              |
| heart_rate     | 66                                |
| fat_percentage | 31.2                              |
| gender         | "male"                            |
| date_of_birth  | { day: 3, month: 12, year: 1978 } |


## Methods

### isAvailable()

Tells if either Google Fit or HealthKit are available.

```
navigator.health.isAvailable(successCallback, errorCallback)
```

- successCallback: {type: function(available)}, if available a true is passed as argument, false otherwise
- errorCallback: {type: function(err)}, called if something went wrong, err contains a textual description of the problem

### requestAuthorization()

Requests read and write access to a set of data types.
This function should be called first in your application.

```
navigator.health.requestAuthorization(datatypes, successCallback, errorCallback)
```

- datatypes: {type: Array of String}, a list of data types you want to be granted access to
- successCallback: {type: function}, called if all OK
- errorCallback: {type: function(err)}, called if something went wrong, err contains a textual description of the problem

### query()

Gets all the records of a certain data type within a certain time window.

Warning: it can generate long arrays!

```
navigator.health.query({
        startDate: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000), // three days ago
        endDate: new Date(), // now
        dataType: 'height'
        }, successCallback, errorCallback)
```

- startDate: {type: Date}, start date from which to get data
- endDate: {type: Date}, end data to which to get the data
- dataType: {type: String}, the data type to be queried (see above)
- successCallback: {type: function(data) }, called if all OK, data contains the result of the query in the form of an array of: { startDate: Date, endDate: Date, value: xxx, unit: 'xxx', source: "xxx" }   - errorCallback: {type: function(err)}, called if something went wrong, err contains a textual description of the problem


Quirks of query()

- in Google Fit calories.basal is returned as an average per day, and usually is not available in all days (may be not available in time windows smaller than 2 or 3 days)
- in Google Fit calories.active is computed by subtracting the basal from the total, as basal an average of the 5 days before endDate is taken
- when querying for activities, Fit is able to determine some activities automatically, while HealthKit only relies on the input of the user or of some external app
- while Google Fit calculates basal and active calories automatically, HealthKit needs an explicit input

### queryAggregated()

Gets aggregated data in a certain time window.

```
navigator.health.queryAggregated({
        startDate: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000), // three days ago
        endDate: new Date(), // now
        dataType: 'steps'
        }, successCallback, errorCallback)
```

- startDate: {type: Date}, start date from which to get data
- endDate: {type: Date}, end data to which to get the data
- dataType: {type: String}, the data type to be queried (see below for supported data types)
- successCallback: {type: function(data) }, called if all OK, data contains the result of the query, see below for returned data types
- errorCallback: {type: function(err)}, called if something went wrong, err contains a textual description of the problem

Not all data types are supported for aggregated queries.
The following table shows what types are supported and examples of aggregated data:

| data type       | example of returned object |
|-----------------|----------------------------|
| steps           | { startDate: Date, endDate: Date, value: 5780, unit: 'count' } |
| distance        | { startDate: Date, endDate: Date, value: 12500.0, unit: 'm' } |
| calories.active | { startDate: Date, endDate: Date, value: 3547.4, unit: 'kcal' } |
| calories.basal  | { startDate: Date, endDate: Date, value: 13146.1, unit: 'kcal' } |
| activity        | { startDate: Date, endDate: Date, value: { still: { duration: 520000, calories: 30, distance: 0 }, walking: { duration: 223000, calories: 20, distance: 15 }}, unit: 'activitySummary' } (note: duration is expressed in milliseconds, distance in meters and calories in kcal) |

Quirks of queryAggregated()

- when querying for activities, calories and distance are provided when available in HealthKit and never in Google Fit

### store()

Stores a data point.

```
navigator.health.store({
	startDate:  new Date(new Date().getTime() - 3 * 60 * 1000), // three minutes ago
	endDate: new Date(),
	dataType: 'steps',
	value: 180,
	source: 'my_app'}, successCallback, errorCallback)
```

- startDate: {type: Date}, start date from which to get data
- endDate: {type: Date}, end data to which to get the data
- dataType: {type: a String}, the data type
- value: {type: a number or an Object}, depending on the actual data type
- source: {type: String}, the source that produced this data. In iOS this is ignored and set automatically to the name of your app.
- successCallback: {type: function}, called if all OK
- errorCallback: {type: function(err)}, called if something went wrong, err contains a textual description of the problem

Quirks of store()

- in iOS distance is assumed to be of type WalkingRunning, if you want to explicitly set it to Cycling you need to add the field ` cycling: true `
- in iOS, storing the sleep activities is not supported at the moment

## Differences between HealthKit and Google Fit

* HealthKit includes medical data (eg blood glucose), Google Fit is currently only related to fitness data
* HealthKit provides a data model that is not extensible, Google Fit allows defining custom data types
* HealthKit allows to insert data with the unit of measurement of your choice, and automatically translates units when quiered, Google Fit stores data with a fixed unit of measurement
* HealthKit automatically counts steps and distance when you carry your phone with you, Google Fit also detects the kind of activity (sedentary, running, walking, cycling, in vehicle)
* HealthKit automatically computes the distance only for running/walking activities, Google Fit includes bicycle also


## Tips for iOS apps

* Make sure your app id has the 'HealthKit' entitlement when this plugin is installed (see iOS dev center).
* Also, make sure your app and AppStore description complies with these Apple review guidelines: https://developer.apple.com/app-store/review/guidelines/#healthkit

## Tips for Android apps

* You need to have the Google Services API downloaded in your SDK
* Be sure to give your app access to the Google Fitness API, see https://developers.google.com/fit/android/get-started

some more detailed instructions are provided [here](https://github.com/2dvisio/cordova-plugin-googlefit)

## External Resources

* The official Apple documentation for [HealthKit can be found here](https://developer.apple.com/library/ios/documentation/HealthKit/Reference/HealthKit_Framework/index.html#//apple_ref/doc/uid/TP40014707).
* For functions that require the `unit` attribute, you can find the comprehensive list of possible units from the [Apple Developers documentation](https://developer.apple.com/library/ios/documentation/HealthKit/Reference/HKUnit_Class/index.html#//apple_ref/doc/uid/TP40014727-CH1-SW2).
* [HealthKit constants](https://developer.apple.com/library/ios/documentation/HealthKit/Reference/HealthKit_Constants/index.html), used throughout the code
* Google Fit [supported data types](https://developers.google.com/fit/android/data-types)

## Roadmap

short term

- add support for HKCategory samples in HealthKit
- refactor HealthKit.js to make it more understandable
- extend the datatypes
 - blood pressure  (KCorrelationTypeIdentifierBloodPressure, custom data type)
 - food (HKCorrelationTypeIdentifierFood, TYPE_NUTRITION)
 - blood glucose
 - location (NA, TYPE_LOCATION)


long term

- add registration to updates (in Android, use sensors API of Google Fit)
- store vital signs on an encrypted DB in the case of Android
- add also Samsung Health as a health record for Android

## Contributions

Any help is more than welcome!
I cannot program in iOS, so I would particularly appreciate someone who can give me a hand.
Just send me an email to my_username at gmail.com
