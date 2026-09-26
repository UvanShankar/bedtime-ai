import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { ParentChildScreen } from "../screens/ParentChildScreen/ParentChildScreen";
import { VoiceSetupScreen } from "../screens/VoiceSetupScreen/VoiceSetupScreen";
import { StoryRequestScreen } from "../screens/StoryRequestScreen/StoryRequestScreen";
import { StoryResultScreen } from "../screens/StoryResultScreen/StoryResultScreen";

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="ParentChild"
        screenOptions={{
          headerStyle: {
            backgroundColor: "#0F172A",
          },
          headerTintColor: "#38BDF8",
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 17,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: "#0F172A",
          },
        }}
      >
        <Stack.Screen
          name="ParentChild"
          component={ParentChildScreen}
          options={{ title: "Profile Setup" }}
        />
        <Stack.Screen
          name="VoiceSetup"
          component={VoiceSetupScreen}
          options={{ title: "Voice Recording" }}
        />
        <Stack.Screen
          name="StoryRequest"
          component={StoryRequestScreen}
          options={{ title: "Bedtime Story Request" }}
        />
        <Stack.Screen
          name="StoryResult"
          component={StoryResultScreen}
          options={{ title: "Bedtime Story Player" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
