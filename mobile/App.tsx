import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NilaProvider } from "./src/context/NilaContext";
import { AppNavigator } from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <NilaProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </NilaProvider>
    </SafeAreaProvider>
  );
}
