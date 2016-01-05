package org.apache.cordova.health;

import android.app.Activity;
import android.content.Intent;
import android.content.IntentSender;
import android.os.Bundle;
import android.util.Log;

import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.Scopes;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.common.api.PendingResult;
import com.google.android.gms.common.api.ResolvingResultCallbacks;
import com.google.android.gms.common.api.ResultCallback;
import com.google.android.gms.common.api.Scope;
import com.google.android.gms.common.api.Status;
import com.google.android.gms.fitness.Fitness;
import com.google.android.gms.fitness.FitnessActivities;
import com.google.android.gms.fitness.data.DataPoint;
import com.google.android.gms.fitness.data.DataSet;
import com.google.android.gms.fitness.data.DataSource;
import com.google.android.gms.fitness.data.DataType;
import com.google.android.gms.fitness.data.Field;
import com.google.android.gms.fitness.request.DataReadRequest;
import com.google.android.gms.fitness.request.DataTypeCreateRequest;
import com.google.android.gms.fitness.result.DataReadResult;
import com.google.android.gms.fitness.result.DataTypeResult;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Health plugin Android code.
 * MIT licensed.
 */
public class HealthPlugin extends CordovaPlugin {
    //logger tag
    private static final String TAG = "cordova-plugin-health";

    //calling activity
    private CordovaInterface cordova;

    //actual Google API client
    private GoogleApiClient mClient;

    public static final int REQUEST_OAUTH = 1;

    //Scope for read/write access to activity-related data types in Google Fit. These include activity type, calories consumed and expended, step counts, and others.
    public static Map<String, DataType> activitydatatypes = new HashMap<String, DataType>();

    static {
        activitydatatypes.put("steps", DataType.TYPE_STEP_COUNT_DELTA);
        activitydatatypes.put("calories", DataType.TYPE_CALORIES_EXPENDED);
        activitydatatypes.put("activity", DataType.TYPE_ACTIVITY_SEGMENT);
    }

    //Scope for read/write access to biometric data types in Google Fit. These include heart rate, height, and weight.
    public static Map<String, DataType> bodydatatypes = new HashMap<String, DataType>();

    static {
        bodydatatypes.put("height", DataType.TYPE_HEIGHT);
        bodydatatypes.put("weight", DataType.TYPE_WEIGHT);
        bodydatatypes.put("heart_rate", DataType.TYPE_HEART_RATE_BPM);
        bodydatatypes.put("fat_percentage", DataType.TYPE_BODY_FAT_PERCENTAGE);
    }

    //Scope for read/write access to location-related data types in Google Fit. These include location, distance, and speed.
    public static Map<String, DataType> locationdatatypes = new HashMap<String, DataType>();

    static {
        locationdatatypes.put("distance", DataType.TYPE_DISTANCE_DELTA);
        //locationdatatypes.put("location", DataType.TYPE_LOCATION_SAMPLE);
    }

    //Scope for read/write access to nutrition data types in Google Fit.
    public static Map<String, DataType> nutritiondatatypes = new HashMap<String, DataType>();

    static {
        nutritiondatatypes.put("food", DataType.TYPE_NUTRITION);
    }

    public static Map<String, DataType> customdatatypes = new HashMap<String, DataType>();


    public static Field genderField = Field.zzn("gender",Field.FORMAT_STRING);
    public static Field dayField = Field.zzn("day",Field.FORMAT_INT32);
    public static Field monthField = Field.zzn("month",Field.FORMAT_INT32);
    public static Field yearField = Field.zzn("year",Field.FORMAT_INT32);



    public HealthPlugin() {
    }

    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
        this.cordova = cordova;
    }

    private CallbackContext authReqCallbackCtx;
    private void authReqSuccess(){
        //Create custom data types
        new Thread(new Runnable(){

            @Override
            public void run() {
                try{
                    String packageName = cordova.getActivity().getApplicationContext().getPackageName();
                    DataTypeCreateRequest request = new DataTypeCreateRequest.Builder()
                            .setName(packageName+".gender")
                            .addField(genderField)
                            .build();
                    PendingResult<DataTypeResult> pendingResult =  Fitness.ConfigApi.createCustomDataType(mClient, request);
                    DataTypeResult dataTypeResult = pendingResult.await();
                    if(!dataTypeResult.getStatus().isSuccess()){
                        authReqCallbackCtx.error(dataTypeResult.getStatus().getStatusMessage());
                        return;
                    }
                    customdatatypes.put("gender", dataTypeResult.getDataType());

                    request = new DataTypeCreateRequest.Builder()
                            .setName(packageName + ".date_of_birth")
                            .addField(dayField)
                            .addField(monthField)
                            .addField(yearField)
                            .build();
                    pendingResult = Fitness.ConfigApi.createCustomDataType(mClient, request);
                    dataTypeResult = pendingResult.await();
                    if(!dataTypeResult.getStatus().isSuccess()){
                        authReqCallbackCtx.error(dataTypeResult.getStatus().getStatusMessage());
                        return;
                    }
                    customdatatypes.put("date_of_birth", dataTypeResult.getDataType());
                    authReqCallbackCtx.success();
                }catch (Exception ex){
                    authReqCallbackCtx.error(ex.getMessage());
                }
            }
        }).start();
    }

    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        if (requestCode == REQUEST_OAUTH) {
            if (resultCode == Activity.RESULT_OK) {
                Log.i(TAG, "Got authorisation from Google Fit!!!");
                if(!mClient.isConnected() && !mClient.isConnecting())
                    mClient.connect();
            }
        }
    }

    /**
     * The "execute" method that Cordova calls whenever the plugin is used from the JavaScript
     *
     * @param action          The action to execute.
     * @param args            The exec() arguments.
     * @param callbackContext The callback context used when calling back into JavaScript.
     * @return
     * @throws JSONException
     */
    @Override
    public boolean execute(String action, final JSONArray args, final CallbackContext callbackContext) throws JSONException {

        if ("requestAuthorization".equals(action)) {
            this.cordova.setActivityResultCallback(this);
            authReqCallbackCtx = callbackContext;

            GoogleApiClient.Builder builder = new GoogleApiClient.Builder(this.cordova.getActivity().getApplicationContext());
            builder.addApi(Fitness.HISTORY_API);
            builder.addApi(Fitness.CONFIG_API);
            builder.addApi(Fitness.SESSIONS_API);
            //scopes: https://developers.google.com/android/reference/com/google/android/gms/common/Scopes.html
            boolean bodyscope = false;
            boolean activityscope = false;
            boolean locationscope = false;
            boolean nutritionscope = false;
            for(int i=0; i< args.length(); i++){
                String type= args.getJSONArray(0).getString(i);
                if(bodydatatypes.get(type) != null)
                    bodyscope = true;
                if(activitydatatypes.get(type) != null)
                    activityscope = true;
                if(locationdatatypes.get(type) != null)
                    locationscope = true;
                if(nutritiondatatypes.get(type) != null)
                    nutritionscope = true;
            }
            if(bodyscope) builder.addScope(new Scope(Scopes.FITNESS_BODY_READ_WRITE));
            if(activityscope) builder.addScope(new Scope(Scopes.FITNESS_ACTIVITY_READ_WRITE));
            if(locationscope) builder.addScope(new Scope(Scopes.FITNESS_LOCATION_READ_WRITE));
            if(nutritionscope) builder.addScope(new Scope(Scopes.FITNESS_NUTRITION_READ_WRITE));

            builder.addOnConnectionFailedListener(
                    new GoogleApiClient.OnConnectionFailedListener() {
                        @Override
                        public void onConnectionFailed(ConnectionResult result) {
                            Log.i(TAG, "Connection failed. Cause: " + result.toString());
                            if (!result.hasResolution()) {
                                Log.e(TAG, result.getErrorMessage());
                                callbackContext.error(result.getErrorMessage());
                                return;
                            }
                            // The failure has a resolution. Resolve it.
                            // Called typically when the app is not yet authorized, and an
                            // authorization dialog is displayed to the user.
                            try {
                                Log.i(TAG, "Attempting to resolve failed connection");
                                result.startResolutionForResult(cordova.getActivity(), REQUEST_OAUTH);
                            } catch (IntentSender.SendIntentException e) {
                                Log.e(TAG, "Exception while starting resolution activity", e);
                                callbackContext.error(result.getErrorMessage());
                            }
                        }
                    }
            );
            mClient = builder.build();
            mClient.registerConnectionCallbacks(new GoogleApiClient.ConnectionCallbacks() {
                @Override
                public void onConnected(Bundle bundle) {
                    mClient.unregisterConnectionCallbacks(this);
                    Log.i(TAG, "Google Fit Connected!!!");
                    authReqSuccess();
                }

                @Override
                public void onConnectionSuspended(int i) {
                    String message = "";
                    if (i == GoogleApiClient.ConnectionCallbacks.CAUSE_NETWORK_LOST) {
                        message = "Connection lost.  Cause: Network Lost";

                    } else if (i == GoogleApiClient.ConnectionCallbacks.CAUSE_SERVICE_DISCONNECTED) {
                        message = "Connection lost.  Reason: Service Disconnected";
                    }
                    Log.e(TAG, message);
                    callbackContext.error(message);
                }
            });
            mClient.blockingConnect();
            return true;
        } else if("query".equals(action)){
            try {
                if(!args.getJSONObject(0).has("startDate")){
                    callbackContext.error("Missing argument startDate");
                    return true;
                }
                long st = args.getJSONObject(0).getLong("startDate");
                if(!args.getJSONObject(0).has("endDate")){
                    callbackContext.error("Missing argument endDate");
                    return true;
                }
                long et = args.getJSONObject(0).getLong("endDate");
                if(!args.getJSONObject(0).has("dataType")){
                    callbackContext.error("Missing argument dataType");
                    return true;
                }
                String datatype = args.getJSONObject(0).getString("dataType");
                DataType dt = null;

                if(bodydatatypes.get(datatype) != null)
                    dt = bodydatatypes.get(datatype);
                if(activitydatatypes.get(datatype) != null)
                    dt = activitydatatypes.get(datatype);
                if(locationdatatypes.get(datatype) != null)
                    dt = locationdatatypes.get(datatype);
                if(nutritiondatatypes.get(datatype) != null)
                    dt = nutritiondatatypes.get(datatype);
                if (customdatatypes.get(datatype) != null)
                    dt = customdatatypes.get(datatype);
                if(dt == null) {
                    callbackContext.error("Datatype " + datatype + " not supported");
                    return true;
                }
                final DataType DT = dt;

                if (!mClient.isConnected()) {
                    mClient.blockingConnect();
                }
                DataReadRequest readRequest =  new DataReadRequest.Builder()
                        //.aggregate(dt, DataType.AGGREGATE_STEP_COUNT_DELTA)
                        //.bucketByTime(1, TimeUnit.HOURS)
                        //.bucketByActivitySegment(1, TimeUnit.HOURS)
                        .setTimeRange(st, et, TimeUnit.MILLISECONDS)
                        .read(dt)
                        .build();


                DataReadResult dataReadResult = Fitness.HistoryApi.readData(mClient, readRequest).await();

                if (dataReadResult.getStatus().isSuccess()) {
                    JSONArray resultset = new JSONArray();
                    List<DataSet> datasets = dataReadResult.getDataSets();
                    for (DataSet dataset : datasets) {
                        for (DataPoint datapoint : dataset.getDataPoints()) {
                            JSONObject obj = new JSONObject();
                            obj.put("startDate", datapoint.getStartTime(TimeUnit.MILLISECONDS));
                            obj.put("endDate", datapoint.getEndTime(TimeUnit.MILLISECONDS));
                            if (datapoint.getDataSource() != null)
                                obj.put("source", datapoint.getDataSource().getName());
                            DataSource hhh = datapoint.getDataSource();

                            //reference for fields: https://developers.google.com/android/reference/com/google/android/gms/fitness/data/Field.html
                            if (DT.equals(DataType.TYPE_STEP_COUNT_DELTA)) {
                                float steps = datapoint.getValue(Field.FIELD_STEPS).asFloat();
                                obj.put("value", steps);
                                obj.put("unit", "count");
                            } else if (DT.equals(DataType.TYPE_DISTANCE_DELTA)) {
                                float distance = datapoint.getValue(Field.FIELD_DISTANCE).asFloat();
                                obj.put("value", distance);
                                obj.put("unit", "m");
                            } else if (DT.equals(DataType.TYPE_CALORIES_EXPENDED)) {
                                float calories = datapoint.getValue(Field.FIELD_CALORIES).asFloat();
                                obj.put("value", calories);
                                obj.put("unit", "kcal");
                            } else if (DT.equals(DataType.TYPE_HEIGHT)) {
                                float height = datapoint.getValue(Field.FIELD_HEIGHT).asFloat();
                                obj.put("value", height);
                                obj.put("unit", "m");
                            } else if (DT.equals(DataType.TYPE_WEIGHT)) {
                                float weight = datapoint.getValue(Field.FIELD_WEIGHT).asFloat();
                                obj.put("value", weight);
                                obj.put("unit", "kg");
                            } else if (DT.equals(DataType.TYPE_HEART_RATE_BPM)) {
                                float weight = datapoint.getValue(Field.FIELD_BPM).asFloat();
                                obj.put("value", weight);
                                obj.put("unit", "bpm");
                            } else if (DT.equals(DataType.TYPE_BODY_FAT_PERCENTAGE)) {
                                float weight = datapoint.getValue(Field.FIELD_PERCENTAGE).asFloat();
                                obj.put("value", weight);
                                obj.put("unit", "percent");
                            } else if (DT.equals(DataType.TYPE_ACTIVITY_SEGMENT)) {
                                String activity = datapoint.getValue(Field.FIELD_ACTIVITY).asActivity();
                                obj.put("value", activity);
                                obj.put("unit", "activityType");
                            } else if (DT.equals(customdatatypes.get("gender"))) {
                                String gender = datapoint.getValue(genderField).asString();
                                obj.put("value", gender);
                            } else if (DT.equals(customdatatypes.get("date_of_birth"))) {
                                int day = datapoint.getValue(dayField).asInt();
                                int month = datapoint.getValue(monthField).asInt();
                                int year = datapoint.getValue(yearField).asInt();
                                JSONObject dob = new JSONObject();
                                dob.put("day", day);
                                dob.put("month", month);
                                dob.put("year", year);
                                obj.put("value", dob);
                            }

                            resultset.put(obj);
                        }
                    }
                    callbackContext.success(resultset);
                } else {
                    callbackContext.error(dataReadResult.getStatus().getStatusMessage());
                }
            } catch (Exception ex) {
                callbackContext.error(ex.getMessage());
            }
            return true;
        }  else if("store".equals(action)) {
            try {
                if (!args.getJSONObject(0).has("startDate")) {
                    callbackContext.error("Missing argument startDate");
                    return true;
                }
                long st = args.getJSONObject(0).getLong("startDate");
                if (!args.getJSONObject(0).has("endDate")) {
                    callbackContext.error("Missing argument endDate");
                    return true;
                }
                long et = args.getJSONObject(0).getLong("endDate");
                if (!args.getJSONObject(0).has("dataType")) {
                    callbackContext.error("Missing argument dataType");
                    return true;
                }
                String datatype = args.getJSONObject(0).getString("dataType");
                if (!args.getJSONObject(0).has("value")) {
                    callbackContext.error("Missing argument value");
                    return true;
                }
                if (!args.getJSONObject(0).has("source")) {
                    callbackContext.error("Missing argument source");
                    return true;
                }
                String source = args.getJSONObject(0).getString("source");

                DataType dt = null;
                if (bodydatatypes.get(datatype) != null)
                    dt = bodydatatypes.get(datatype);
                if (activitydatatypes.get(datatype) != null)
                    dt = activitydatatypes.get(datatype);
                if (locationdatatypes.get(datatype) != null)
                    dt = locationdatatypes.get(datatype);
                if (nutritiondatatypes.get(datatype) != null)
                    dt = nutritiondatatypes.get(datatype);
                if (customdatatypes.get(datatype) != null)
                    dt = customdatatypes.get(datatype);
                if (dt == null) {
                    callbackContext.error("Datatype " + datatype + " not supported");
                    return true;
                }

                if (!mClient.isConnected()) {
                    mClient.blockingConnect();
                }

                String packageName = cordova.getActivity().getApplicationContext().getPackageName();

                DataSource datasrc = new DataSource.Builder()
                        .setAppPackageName(packageName)
                        .setName(source)
                        .setDataType(dt)
                        .setType(DataSource.TYPE_RAW)
                        .build();

                DataSet dataSet = DataSet.create(datasrc);
                DataPoint datapoint = DataPoint.create(datasrc);
                datapoint.setTimeInterval(st, et, TimeUnit.MILLISECONDS);
                if (dt.equals(DataType.TYPE_STEP_COUNT_DELTA)) {
                    String value = args.getJSONObject(0).getString("value");
                    int steps = Integer.parseInt(value);
                    datapoint.getValue(Field.FIELD_STEPS).setInt(steps);
                } else if (dt.equals(DataType.TYPE_DISTANCE_DELTA)) {
                    String value = args.getJSONObject(0).getString("value");
                    float dist = Float.parseFloat(value);
                    datapoint.getValue(Field.FIELD_DISTANCE).setFloat(dist);
                } else if (dt.equals(DataType.TYPE_CALORIES_EXPENDED)) {
                    String value = args.getJSONObject(0).getString("value");
                    float cals = Float.parseFloat(value);
                    datapoint.getValue(Field.FIELD_CALORIES).setFloat(cals);
                } else if (dt.equals(DataType.TYPE_HEIGHT)) {
                    String value = args.getJSONObject(0).getString("value");
                    float height = Float.parseFloat(value);
                    datapoint.getValue(Field.FIELD_HEIGHT).setFloat(height);
                } else if (dt.equals(DataType.TYPE_WEIGHT)) {
                    String value = args.getJSONObject(0).getString("value");
                    float weight = Float.parseFloat(value);
                    datapoint.getValue(Field.FIELD_WEIGHT).setFloat(weight);
                } else if (dt.equals(DataType.TYPE_HEART_RATE_BPM)) {
                    String value = args.getJSONObject(0).getString("value");
                    int hr = Integer.parseInt(value);
                    datapoint.getValue(Field.FIELD_BPM).setInt(hr);
                } else if (dt.equals(DataType.TYPE_BODY_FAT_PERCENTAGE)) {
                    String value = args.getJSONObject(0).getString("value");
                    float perc = Float.parseFloat(value);
                    datapoint.getValue(Field.FIELD_PERCENTAGE).setFloat(perc);
                }  else if (dt.equals(DataType.TYPE_ACTIVITY_SEGMENT)) {
                    String value = args.getJSONObject(0).getString("value");
                    datapoint.getValue(Field.FIELD_ACTIVITY).setActivity(value);
                } else if (dt.equals(customdatatypes.get("gender"))) {
                    String value = args.getJSONObject(0).getString("value");
                    datapoint.getValue(genderField).setString(value);
                } else if(dt.equals(customdatatypes.get("date_of_birth"))){
                    JSONObject dob = args.getJSONObject(0).getJSONObject("value");
                    int year = dob.getInt("year");
                    int month = dob.getInt("month");
                    int day = dob.getInt("day");
                    datapoint.getValue(dayField).setInt(day);
                    datapoint.getValue(monthField).setInt(month);
                    datapoint.getValue(yearField).setInt(year);
                }
                dataSet.add(datapoint);


                Status insertStatus = Fitness.HistoryApi.insertData(mClient, dataSet)
                        .await(1, TimeUnit.MINUTES);

                if (!insertStatus.isSuccess()) {
                    callbackContext.error(insertStatus.getStatusMessage());
                } else {
                    callbackContext.success();
                }
            }catch (Exception ex){
                callbackContext.error(ex.getMessage());
            }
            return true;
        }

        return false;
    }

}
