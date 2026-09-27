import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NilaColors } from "../theme/colors";

// Onboarding & Auth Screens
import { SplashScreen } from "../screens/Onboarding/SplashScreen";
import { WelcomeScreen } from "../screens/Onboarding/WelcomeScreen";
import { LoginScreen } from "../screens/Onboarding/LoginScreen";
import { SignupScreen } from "../screens/Onboarding/SignupScreen";
import { ParentProfileSetupScreen } from "../screens/Onboarding/ParentProfileSetupScreen";
import { ChildProfileSetupScreen } from "../screens/Onboarding/ChildProfileSetupScreen";
import { LanguageStyleSetupScreen } from "../screens/Onboarding/LanguageStyleSetupScreen";
import { VoiceIntroScreen } from "../screens/Onboarding/VoiceIntroScreen";
import { VoiceRecordingScreen } from "../screens/Onboarding/VoiceRecordingScreen";
import { VoiceProcessingScreen } from "../screens/Onboarding/VoiceProcessingScreen";
import { VoiceReadyScreen } from "../screens/Onboarding/VoiceReadyScreen";

// Main Tabs Container
import { MainTabsScreen } from "../screens/MainTabsScreen/MainTabsScreen";

// Story Flow Screens
import { StoryRequestScreen } from "../screens/StoryRequestScreen/StoryRequestScreen";
import { StoryCreationScreen } from "../screens/StoryCreationScreen/StoryCreationScreen";
import { StoryReadyScreen } from "../screens/StoryReadyScreen/StoryReadyScreen";
import { StoryPlayerScreen } from "../screens/StoryPlayerScreen/StoryPlayerScreen";
import { StoryCompleteScreen } from "../screens/StoryCompleteScreen/StoryCompleteScreen";

// Memory Flow Screens
import { AddMemoryScreen } from "../screens/MemoriesScreen/AddMemoryScreen";
import { MemoryDetailScreen } from "../screens/MemoriesScreen/MemoryDetailScreen";

// Profile / Settings Screens
import { VoiceProfileScreen } from "../screens/ProfileScreen/VoiceProfileScreen";
import { StoryStyleScreen } from "../screens/ProfileScreen/StoryStyleScreen";
import { SettingsScreen } from "../screens/ProfileScreen/SettingsScreen";
import { ChildProfileScreen } from "../screens/ProfileScreen/ChildProfileScreen";

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: NilaColors.midnight,
          },
          animation: "fade",
        }}
      >
        {/* Onboarding & Auth */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="ParentProfileSetup" component={ParentProfileSetupScreen} />
        <Stack.Screen name="ChildProfileSetup" component={ChildProfileSetupScreen} />
        <Stack.Screen name="LanguageStyleSetup" component={LanguageStyleSetupScreen} />
        <Stack.Screen name="VoiceIntro" component={VoiceIntroScreen} />
        <Stack.Screen name="VoiceRecording" component={VoiceRecordingScreen} />
        <Stack.Screen name="VoiceProcessing" component={VoiceProcessingScreen} />
        <Stack.Screen name="VoiceReady" component={VoiceReadyScreen} />

        {/* Main Tab App (Home, Stories, Memories, Profile) */}
        <Stack.Screen name="MainTabs" component={MainTabsScreen} />

        {/* Story Flow */}
        <Stack.Screen
          name="StoryRequest"
          component={StoryRequestScreen}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="StoryCreation"
          component={StoryCreationScreen}
          options={{ animation: "fade" }}
        />
        <Stack.Screen
          name="StoryReady"
          component={StoryReadyScreen}
          options={{ animation: "fade" }}
        />
        <Stack.Screen
          name="StoryPlayer"
          component={StoryPlayerScreen}
          options={{ animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="StoryComplete"
          component={StoryCompleteScreen}
          options={{ animation: "fade" }}
        />

        {/* Memories Flow */}
        <Stack.Screen
          name="AddMemory"
          component={AddMemoryScreen}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="MemoryDetail"
          component={MemoryDetailScreen}
          options={{ animation: "slide_from_right" }}
        />

        {/* Profile & Settings Sub-screens */}
        <Stack.Screen
          name="VoiceProfile"
          component={VoiceProfileScreen}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="StoryStyle"
          component={StoryStyleScreen}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="ChildProfile"
          component={ChildProfileScreen}
          options={{ animation: "slide_from_right" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
