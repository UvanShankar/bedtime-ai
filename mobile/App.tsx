import "./src/utils/alertPolyfill";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import { NilaProvider } from "./src/context/NilaContext";
import { ToastProvider } from "./src/context/ToastContext";
import { AppNavigator } from "./src/navigation/AppNavigator";

export default function App() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <NilaProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </NilaProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
