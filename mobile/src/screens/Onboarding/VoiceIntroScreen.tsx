import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NilaColors } from "../../theme/colors";
import { OnboardingHeader } from "../../components/common/OnboardingHeader";
import { NilaButton } from "../../components/common/NilaButton";
import { useNila } from "../../context/NilaContext";
import { ApiClient } from "../../services/api/ApiClient";

interface Props {
  navigation: any;
}

export const VoiceIntroScreen: React.FC<Props> = ({ navigation }) => {
  const { setIsOnboarded } = useNila();
  const [consentAccepted, setConsentAccepted] = useState(true);

  const steps = [
    {
      num: "1",
      icon: "mic-outline",
      title: "Read a 15-second bedtime passage",
      desc: "Speak naturally in your ordinary, loving bedtime tone.",
    },
    {
      num: "2",
      icon: "shield-checkmark-outline",
      title: "Private & Secure to Your Family",
      desc: "Encrypted and only used to narrate bedtime stories for your children.",
    },
    {
      num: "3",
      icon: "headset-outline",
      title: "Listen to Endless Bedtime Tales",
      desc: "Nila generates wonderful adventures told in your comforting voice.",
    },
  ];

  const handleSkipToMain = async () => {
    await ApiClient.setOnboardingCompleted(true);
    setIsOnboarded(true);
    navigation.replace("MainTabs");
  };

  return (
    <SafeAreaView style={styles.container}>
      <OnboardingHeader
        step={4}
        totalSteps={4}
        title="Capture your loving voice"
        subtitle="Your child knows and trusts your voice. That's what makes Nila bedtime stories feel like home."
        onBack={() => navigation.goBack()}
        onSkip={handleSkipToMain}
        skipLabel="Skip for now"
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Steps Card */}
        <View style={styles.stepsCard}>
          {steps.map((step, idx) => (
            <View
              key={step.num}
              style={[
                styles.stepItem,
                idx < steps.length - 1 && styles.stepDivider,
              ]}
            >
              <View style={styles.stepNumCircle}>
                <Ionicons name={step.icon as any} size={18} color={NilaColors.gold} />
              </View>
              <View style={styles.stepTextContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Consent Checkbox */}
        <TouchableOpacity
          style={styles.consentRow}
          onPress={() => setConsentAccepted(!consentAccepted)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, consentAccepted && styles.checkboxActive]}>
            {consentAccepted && (
              <Ionicons name="checkmark" size={14} color={NilaColors.midnight} />
            )}
          </View>
          <Text style={styles.consentText}>
            I give permission for Nila to create and privately use my voice clone
            exclusively for my family's bedtime stories.
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <NilaButton
          title="Record My Voice (15s)"
          onPress={() => navigation.navigate("VoiceRecording")}
          disabled={!consentAccepted}
          style={styles.continueButton}
        />
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkipToMain}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>
            Use Nila's Storyteller Voice for now
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NilaColors.midnight,
    justifyContent: "space-between",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  stepsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 20,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    gap: 14,
  },
  stepDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  stepNumCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(245, 199, 106, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepTextContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: NilaColors.textPrimary,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 12,
    color: NilaColors.textMuted,
    lineHeight: 18,
  },
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: NilaColors.gold,
    borderColor: NilaColors.gold,
  },
  consentText: {
    flex: 1,
    fontSize: 12,
    color: NilaColors.textMuted,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: NilaColors.midnight,
  },
  continueButton: {
    marginBottom: 12,
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  skipButtonText: {
    fontSize: 13,
    color: NilaColors.textMuted,
    fontWeight: "500",
  },
});
