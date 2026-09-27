import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NilaColors } from "../../theme/colors";
import { NilaHeader } from "../../components/common/NilaHeader";
import { NilaButton } from "../../components/common/NilaButton";

interface Props {
  navigation: any;
}

export const VoiceIntroScreen: React.FC<Props> = ({ navigation }) => {
  const [consentAccepted, setConsentAccepted] = useState(true);

  const steps = [
    {
      num: "1",
      title: "Record your voice",
      desc: "We'll guide you to read a short, warm story script naturally.",
    },
    {
      num: "2",
      title: "Create your private voice profile",
      desc: "Securely processed. Only accessible inside your family account.",
    },
    {
      num: "3",
      title: "Tell stories in your voice",
      desc: "Listen to beautiful customized tales narrated in your gentle tone.",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <NilaHeader
        title="Let's capture your voice"
        subtitle="Your child already knows your voice. That's what makes Nila feel like home."
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Steps Card */}
        <View style={styles.stepsCard}>
          {steps.map((step, idx) => (
            <View key={step.num} style={[styles.stepItem, idx < steps.length - 1 && styles.stepDivider]}>
              <View style={styles.stepNumCircle}>
                <Text style={styles.stepNumText}>{step.num}</Text>
              </View>
              <View style={styles.stepTextContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.disclaimerText}>
          A short recording is used to create your voice profile for bedtime stories.
        </Text>

        {/* Consent Checkbox */}
        <TouchableOpacity
          style={styles.consentRow}
          onPress={() => setConsentAccepted(!consentAccepted)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, consentAccepted && styles.checkboxActive]}>
            {consentAccepted && <Ionicons name="checkmark" size={14} color={NilaColors.midnight} />}
          </View>
          <Text style={styles.consentText}>
            I give permission for Nila to create and use a voice model from my recording for my bedtime
            stories. See <Text style={styles.linkText}>Voice consent details</Text> and{" "}
            <Text style={styles.linkText}>Privacy policy</Text>.
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <NilaButton
          title="Continue"
          onPress={() => navigation.navigate("VoiceRecording")}
          disabled={!consentAccepted}
          style={styles.continueButton}
        />
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => navigation.navigate("MainTabs")}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>Use a Nila voice for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NilaColors.midnight,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  stepsCard: {
    backgroundColor: NilaColors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    marginBottom: 20,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
  },
  stepDivider: {
    borderBottomWidth: 1,
    borderBottomColor: NilaColors.cardBorderSubtle,
  },
  stepNumCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: NilaColors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    borderWidth: 1,
    borderColor: NilaColors.goldMuted,
  },
  stepNumText: {
    color: NilaColors.gold,
    fontSize: 14,
    fontWeight: "700",
  },
  stepTextContent: {
    flex: 1,
  },
  stepTitle: {
    color: NilaColors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  stepDesc: {
    color: NilaColors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  disclaimerText: {
    color: NilaColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: NilaColors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: NilaColors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: NilaColors.gold,
    borderColor: NilaColors.gold,
  },
  consentText: {
    flex: 1,
    color: NilaColors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  linkText: {
    color: NilaColors.gold,
    textDecorationLine: "underline",
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: NilaColors.cardBorderSubtle,
  },
  continueButton: {
    marginBottom: 12,
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  skipButtonText: {
    color: NilaColors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
});
