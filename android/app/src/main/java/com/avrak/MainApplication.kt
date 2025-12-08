package com.avrak

import android.app.Application
import com.avrak.directcall.DirectCallPackage
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList = 
        PackageList(this).packages.apply {
          // Register your custom native module manually
          add(DirectCallPackage())
        }
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
