import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { VoiceRecorder } from "../../components/VoiceRecorder/VoiceRecorder";
import { useVoiceRecorder } from "../../hooks/useVoiceRecorder";
import { VoiceApi } from "../../services/api/VoiceApi";

interface Props {
  route: any;
  navigation: any;
}

export const VoiceSetupScreen: React.FC<Props> = ({ route, navigation }) => {
  const { parent, child } = route.params;

  const [consentAccepted, setConsentAccepted] = useState(false);
  const [voiceCloned, setVoiceCloned] = useState(false);

  const {
    state,
    durationSeconds,
    isPlayingPreview,
    recordingUri,
    errorMessage,
    startRecording,
    stopRecording,
    playPreview,
    pausePreview,
    resetRecording,
    setUploadingState,
    setProcessingState,
    setReadyState,
    setErrorState,
  } = useVoiceRecorder();

  const handleUploadAndClone = async () => {
    if (!consentAccepted) {
      Alert.alert("Consent Required", "Please accept the voice recording consent before proceeding.");
      return;
    }

    if (!recordingUri) {
      Alert.alert("No Recording", "Please record a voice sample first.");
      return;
    }

    try {
      setUploadingState();
      // Step 1: Upload to backend
      setProcessingState();
      const response = await VoiceApi.uploadVoiceSample({
        parentId: parent.id,
        audioUri: recordingUri,
        mimeType: "audio/m4a",
        consent: true,
      });

      setReadyState();
      setVoiceCloned(true);
      Alert.alert(
        "Voice Profile Ready!",
        "Your voice and storytelling style have been analyzed. Ready to create your first story.",
        [
          {
            text: "Go to Story Request",
            onPress: () =>
              navigation.navigate("StoryRequest", {
                parent,
                child,
                voiceProfile: response.voiceProfile,
              }),
          },
        ]
      );
    } catch (err: any) {
      setErrorState(err.message || "Failed to upload and analyze voice");
      Alert.alert("Upload Error", err.message || "Could not process voice sample.");
    }
  };

  const handleSkipOrContinue = () => {
    navigation.navigate("StoryRequest", {
      parent,
      child,
      voiceProfile: null,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>🎙️ Parent Voice Setup</Text>
      <Text style={styles.subtitle}>
        Record your voice so Bedtime AI can narrate stories to {child.name} in your loving tone.
      </Text>

      {/* SAMPLE SCRIPT BOX */}
      <View style={styles.scriptBox}>
        <Text style={styles.scriptHeader}>📖 Reading Sample (Read Aloud Naturally):</Text>
        <Text style={styles.scriptText}>
          "Once upon a time, my sweet {child.name}, the stars in the night sky began to glow like tiny night-lights. The little animals yawned and curled up in their soft nests. Everything was quiet, safe, and warm. Goodnight, little one."
        </Text>
      </View>

      {/* RECORDER COMPONENT */}
      <VoiceRecorder
        state={state}
        durationSeconds={durationSeconds}
        isPlayingPreview={isPlayingPreview}
        onStartRecord={startRecording}
        onStopRecord={stopRecording}
        onPlayPreview={playPreview}
        onPausePreview={pausePreview}
        onReset={resetRecording}
      />

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      {/* CONSENT CHECKBOX */}
      <TouchableOpacity
        style={styles.consentRow}
        onPress={() => setConsentAccepted(!consentAccepted)}
        activeOpacity={0.8}
      >
        <View style={[styles.checkbox, consentAccepted && styles.checkboxActive]}>
          {consentAccepted && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.consentText}>
          I consent to Bedtime AI securely processing and storing my voice sample solely to synthesize bedtime stories for my child. Data is stored privately and can be deleted at any time.
        </Text>
      </TouchableOpacity>

      {/* ACTION BUTTONS */}
      {state === "recorded" && (
        <TouchableOpacity
          style={[styles.uploadButton, !consentAccepted && styles.disabledButton]}
          onPress={handleUploadAndClone}
          disabled={!consentAccepted}
        >
          <Text style={styles.uploadButtonText}>✨ Upload & Create Voice Profile</Text>
        </TouchableOpacity>
      )}

      {voiceCloned && (
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() =>
            navigation.navigate("StoryRequest", {
              parent,
              child,
            })
          }
        >
          <Text style={styles.continueButtonText}>Proceed to Story Request →</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.skipButton} onPress={handleSkipOrContinue}>
        <Text style={styles.skipButtonText}>Skip voice setup (Use default voice)</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#F8FAFC",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#94A3B8",
    marginBottom: 16,
    lineHeight: 20,
  },
  scriptBox: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#38BDF8",
  },
  scriptHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: "#38BDF8",
    marginBottom: 8,
  },
  scriptText: {
    fontSize: 14,
    color: "#E2E8F0",
    lineHeight: 22,
    fontStyle: "italic",
  },
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#1E293B",
    padding: 14,
    borderRadius: 12,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#64748B",
    marginRight: 12,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: "#38BDF8",
    borderColor: "#38BDF8",
  },
  checkmark: {
    color: "#0F172A",
    fontWeight: "800",
    fontSize: 14,
  },
  consentText: {
    flex: 1,
    color: "#CBD5E1",
    fontSize: 12,
    lineHeight: 18,
  },
  uploadButton: {
    backgroundColor: "#38BDF8",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 12,
  },
  uploadButtonText: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
  },
  continueButton: {
    backgroundColor: "#10B981",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 12,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.5,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  skipButtonText: {
    color: "#64748B",
    fontSize: 13,
  },
  errorText: {
    color: "#EF4444",
    textAlign: "center",
    marginVertical: 8,
    fontSize: 13,
  },
});
