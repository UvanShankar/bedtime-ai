import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NilaColors } from "../../theme/colors";
import { VoiceApi } from "../../services/api/VoiceApi";
import { useNila } from "../../context/NilaContext";
import { logger } from "../../utils/logger";

interface Props {
  route: any;
  navigation: any;
}

export const VoiceProcessingScreen: React.FC<Props> = ({ route, navigation }) => {
  const { parent, setParent, setVoiceProfile, addVoiceProfile, ensureBackendProfile } = useNila();
  const { recordingUri } = route.params || {};

  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    "Creating your voice",
    "Understanding your language",
    "Learning your rhythm",
  ];

  useEffect(() => {
    let isMounted = true;

    // Simulate subtle step advancement while calling API
    const timer1 = setTimeout(() => isMounted && setActiveStep(1), 1200);

    const processUpload = async () => {
      logger.info("VOICE", `[VoiceProcessingScreen] Processing voice sample upload (${recordingUri})...`);
      try {
        if (!recordingUri) {
          throw new Error("No voice recording was provided");
        }

        // 1. Ensure backend authentication and profile
        let parentId = parent?.id;
        try {
          const synced = await ensureBackendProfile();
          if (synced?.parentId) {
            parentId = synced.parentId;
          }
        } catch (authErr: any) {
          logger.warn("VOICE", `[VoiceProcessingScreen] Profile sync note: ${authErr.message}`);
        }

        const chosenRel = route.params?.relationship || parent?.relationship || "Parent";
        const chosenName = route.params?.displayName || (parent?.name ? `${parent.name}'s Voice` : `${chosenRel}'s Voice`);
        const chosenProvider = (route.params?.provider || "sarvam").toLowerCase();

        logger.info("VOICE", `[VoiceProcessingScreen] Initiating voice cloning pipeline: name="${chosenName}" | provider="${chosenProvider}" | rel="${chosenRel}"`);

        // 2. Upload voice sample and register in backend
        const res = await VoiceApi.uploadVoiceSample({
          parentId: parentId || "parent-001",
          audioUri: recordingUri,
          consent: true,
          displayName: chosenName,
          relationship: chosenRel,
          provider: chosenProvider,
        });

        if (res?.voiceProfile) {
          logger.success("VOICE", `[VoiceProcessingScreen] Voice registered in database: ${res.voiceProfile.displayName} (id: ${res.voiceProfile.id})`);
          addVoiceProfile(res.voiceProfile);
          setParent((prev) => ({
            ...prev,
            relationship: chosenRel as any,
          }));

          if (isMounted) {
            setActiveStep(2);
            setTimeout(() => {
              if (isMounted) {
                logger.info("VOICE", `[VoiceProcessingScreen] Transitioning to VoiceReady screen with recordingUri=${recordingUri}`);
                navigation.replace("VoiceReady", { recordingUri });
              }
            }, 800);
          }
        }
      } catch (err: any) {
        logger.error("VOICE", `[VoiceProcessingScreen] Voice processing failed: ${err.message}`, err);
        if (isMounted) {
          Alert.alert(
            "Voice Registration Failed",
            err.message || "Failed to process and clone voice sample on the server. Please try again.",
            [
              { text: "Retry", onPress: () => processUpload() },
              { text: "Cancel", style: "cancel", onPress: () => navigation.goBack() },
            ]
          );
        }
      }
    };

    processUpload();

    return () => {
      isMounted = false;
      clearTimeout(timer1);
    };
  }, [recordingUri, parent.id, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.illustrationWrapper}>
          <View style={styles.glowCircle} />
          <Text style={styles.moonIcon}>â˜¾</Text>
        </View>

        <Text style={styles.title}>
          {route.params?.displayName ? `Setting up ${route.params.displayName}...` : "Getting to know your voice..."}
        </Text>
        <Text style={styles.subtitle}>
          Nila is listening to the warmth of your recording.
        </Text>

        <View style={styles.stepsContainer}>
          {steps.map((step, idx) => {
            const isDone = idx < activeStep;
            const isCurrent = idx === activeStep;

            return (
              <View key={step} style={styles.stepRow}>
                <View
                  style={[
                    styles.stepIndicator,
                    isDone && styles.stepIndicatorDone,
                    isCurrent && styles.stepIndicatorCurrent,
                  ]}
                >
                  {isDone ? (
                    <Ionicons name="checkmark" size={14} color={NilaColors.textDark} />
                  ) : isCurrent ? (
                    <View style={styles.currentDot} />
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.stepText,
                    (isDone || isCurrent) && styles.stepTextActive,
                  ]}
                >
                  {step}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NilaColors.midnight,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 32,
    width: "100%",
  },
  illustrationWrapper: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    position: "relative",
  },
  glowCircle: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(245, 199, 106, 0.08)",
  },
  moonIcon: {
    fontSize: 64,
    color: NilaColors.gold,
    textShadowColor: NilaColors.goldGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: NilaColors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: NilaColors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 36,
  },
  stepsContainer: {
    width: "100%",
    backgroundColor: NilaColors.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    gap: 16,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: NilaColors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  stepIndicatorDone: {
    backgroundColor: NilaColors.gold,
    borderColor: NilaColors.gold,
  },
  stepIndicatorCurrent: {
    borderColor: NilaColors.gold,
  },
  currentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: NilaColors.gold,
  },
  stepText: {
    color: NilaColors.textMuted,
    fontSize: 15,
  },
  stepTextActive: {
    color: NilaColors.textPrimary,
    fontWeight: "600",
  },
});
