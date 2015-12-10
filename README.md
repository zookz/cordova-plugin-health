# Cordova Health Plugin

A plugin that abstracts fitness and health repositories like Apple HealthKit or Google Fit.

This work is based on [cordova plugin googlefit](https://github.com/2dvisio/cordova-plugin-googlefit) and on [cordova healthkit plugin](https://github.com/Telerik-Verified-Plugins/HealthKit)

## Warning

This plugin stores health data in Google Fit, practice that is discouraged by Google.


## Supported data types

As HealthKit does not allow adding custom data types, only a subset of data types supported by HealthKit has been chosen.
Gogole Fit is limited to fitness data and, when needed, custom data types are defined witht he suffix of the package name of your project.

| data type      |      HealthKit equivalent (unit)                        |  Google Fit equivalent                   |
|----------------|---------------------------------------------------------|------------------------------------------|
| steps          | HKQuantityTypeIdentifierStepCount (count)               |  TYPE_STEP_COUNT_DELTA                   |
| distance       | HKQuantityTypeIdentifierDistanceWalkingRunning (m)      |  TYPE_DISTANCE_DELTA                     |
| calories       | HKQuantityTypeIdentifierActiveEnergyBurned (kcal)       |  TYPE_CALORIES_EXPENDED                  |
| height         | HKQuantityTypeIdentifierHeight (m)                      |  TYPE_HEIGHT                             |
| weight         | HKQuantityTypeIdentifierBodyMass (kg)                   |  TYPE_WEIGHT                             |
| heart_rate     | HKQuantityTypeIdentifierHeartRate (count/min            |  TYPE_HEART_RATE_BPM                     |
| fat_percentage | HKQuantityTypeIdentifierBodyFatPercentage (%)           |  TYPE_BODY_FAT_PERCENTAGE                |
| gender         | HKCharacteristicTypeIdentifierBiologicalSex             |  custom (YOUR_PACKAGE_NAME.gender)       |
| date_of_birth  | HKCharacteristicTypeIdentifierDateOfBirth               | custom (YOUR_PACKAGE_NAME.date_of_birth) |


Note: unit of measurements are fixed !

Data types can be of different types, see examples below:

| data type      | value                             |
|----------------|-----------------------------------|
| steps          | 34                                |
| distance       | 101.2                             |
| calories       | 245.3                             |
| height         | 185.9                             |
| weight         | 83.3                              |
| heart_rate     | 66                                |
| fat_percentage | 31.2                              |
| gender         | "male"                            |
| date_of_birth  | { day: 3, month: 12, year: 1978 } |


## Methods

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
- successCallback: {type: function(data) }, called if all OK, data contains the result of the query in the form of an array of: { startDate: Date, endDate: Date, value: xxx, unit: 'xxx', source: "xxx" }   
- errorCallback: {type: function(err)}, called if something went wrong, err contains a textual description of the problem


Quirks of query()

- calories in Android is returned as sum within the specified time window


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
- endDate: {type: Date}, end data to which to get teh data
- dataType: {type: a String}, the data type
- value: {type: a number or an Object}, depending on the actual data type
- source: {type: String}, the source that produced this data. In iOS this ignored and set automatically to the name of your app.
- successCallback: {type: function}, called if all OK
- errorCallback: {type: function(err)}, called if something went wrong, err contains a textual description of the problem


## Differences between HealthKit and Google Fit

* HealthKit includes medical data (eg blood glucose), Google Fit is currently only related to fitness data
* HealthKit provides a data model that is not extensible, Google Fit allows defining custom data types
* HealthKit allows to insert data with the unit of measurement of your choice, and automatically translates units when quiered, Google Fit stores data with a fixed unit of measurent
* HealthKit automatically counts steps and distance when you carry your phone with you, Google Fit also detects the kind of activity (sedentary, running, walking, cycling, in vehicle)
* HealthKit automatically computes the distance only for running/walking activities, Google Fit includes bicycle also


## Tips for iOS apps

* Make sure your app id has the 'HealthKit' entitlement when this plugin is installed (see iOS dev center).
* Also, make sure your app and AppStore description complies with these Apple review guidelines: https://developer.apple.com/app-store/review/guidelines/#healthkit

## Tips for Android apps

* You need to ahve the Google Services API downloaded in your SDK
* Be sure to give your app access to the Google Fitness API, see https://developers.google.com/fit/android/get-started

some more detailed instructions are provided [here](https://github.com/2dvisio/cordova-plugin-googlefit)

## External Resources

* The official Apple documentation for [HealthKit can be found here](https://developer.apple.com/library/ios/documentation/HealthKit/Reference/HealthKit_Framework/index.html#//apple_ref/doc/uid/TP40014707).
* For functions that require the `unit` attribute, you can find the [comprehensive list of possible units from the Apple Developers documentation](https://developer.apple.com/library/ios/documentation/HealthKit/Reference/HKUnit_Class/index.html#//apple_ref/doc/uid/TP40014727-CH1-SW2).
* Google Fit [supported data types](https://developers.google.com/fit/android/data-types)

## Roadmap

short term

- add aggregated query
- add search for workouts
- extend the datatypes
 - blood glucose
 - blood pressure  (KCorrelationTypeIdentifierBloodPressure, custom data type)
 - food (HKCorrelationTypeIdentifierFood, TYPE_NUTRITION)
 - location (not supported in iOS, TYPE_LOCATION)


long term

- add registration to updates (in Android, use sensors API of Google Fit)
- store vital signs on an encrypted DB in the case of Android
- add also Samsung Health as a health record for Android

## Contributions

Any help is more than welcome!
I cannot program in iOS, so I would particularly appreciate someone who can give me a hand.
Just send me an email to my_username at gmail

