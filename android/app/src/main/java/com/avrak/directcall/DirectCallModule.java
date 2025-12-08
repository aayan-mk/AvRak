package com.avrak.directcall;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class DirectCallModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public DirectCallModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "DirectCall";
    }

    @ReactMethod
    public void makeCall(String phoneNumber, Promise promise) {
        try {
            Activity currentActivity = getCurrentActivity();
            if (currentActivity == null) {
                promise.reject("NO_ACTIVITY", "No activity found");
                return;
            }
            if (ContextCompat.checkSelfPermission(reactContext, Manifest.permission.CALL_PHONE) != PackageManager.PERMISSION_GRANTED) {
                promise.reject("NO_PERMISSION", "CALL_PHONE permission not granted");
                return;
            }
            Intent callIntent = new Intent(Intent.ACTION_CALL);
            callIntent.setData(Uri.parse("tel:" + phoneNumber));
            callIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(callIntent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("CALL_FAILED", e.getMessage());
        }
    }
}
