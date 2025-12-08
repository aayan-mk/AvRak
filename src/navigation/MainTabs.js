// src/navigation/MainTabs.js
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";

import HomeScreen from "../screens/HomeScreen";
import ConnectDeviceScreen from "../screens/ConnectDeviceScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarShowLabel: true,
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#555",

        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0.3,
          height: 65,
          paddingBottom: 8,
          paddingTop: 6,
        },

        // FIXED ICONS
        tabBarIcon: ({ focused, color }) => {
          let iconName;

          switch (route.name) {
            case "Home":
              iconName = focused ? "home" : "home-outline";
              break;

            case "Connect":
              iconName = focused ? "bluetooth" : "bluetooth-outline";
              break;

            case "Profile":
              iconName = focused ? "person" : "person-outline";
              break;

            default:
              iconName = "ellipse-outline";
          }

          return <Ionicons name={iconName} size={26} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Connect" component={ConnectDeviceScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
