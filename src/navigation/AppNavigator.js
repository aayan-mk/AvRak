import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { auth } from "../services/firebaseConfig";

import AuthNavigator from "./AuthNavigator";
import MainTabs from "./MainTabs";

export default function AppNavigator() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setInitializing(false);
    });
    return unsub;
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return user ? <MainTabs /> : <AuthNavigator />;
}
