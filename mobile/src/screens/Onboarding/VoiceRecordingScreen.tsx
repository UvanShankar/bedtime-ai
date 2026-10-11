import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NilaColors } from "../../theme/colors";
import { OnboardingHeader } from "../../components/common/OnboardingHeader";
import { NilaHeader } from "../../components/common/NilaHeader";
import { NilaButton } from "../../components/common/NilaButton";
import { useVoiceRecorder } from "../../hooks/useVoiceRecorder";
import { ParentApi } from "../../services/api/ParentApi";
import { useNila } from "../../context/NilaContext";
import { ApiClient } from "../../services/api/ApiClient";
import { logger } from "../../utils/logger";
import { READING_SCRIPTS } from "../../config/localization";

interface Props {
  navigation: any;
}

export const VoiceRecordingScreen: React.FC<Props> = ({ navigation }) => {
  const { parent, setParent, isOnboarded, setIsOnboarded } = useNila();

  const userLanguage = parent.language || "Tamil";
  const scriptsList = READING_SCRIPTS[userLanguage] || READING_SCRIPTS["Tamil"];
  const [scriptIndex, setScriptIndex] = useState(0);
  const [scriptMode, setScriptMode] = useState<"native" | "phonetic">("native");

  const activeScript = scriptsList[scriptIndex] || scriptsList[0];

  const defaultVoiceName = parent?.name
    ? `${parent.name}'s Voice`
    : `${parent?.relationship || "Family"}'s Voice`;

  const [voiceName, setVoiceName] = useState(defaultVoiceName);

  const {
    state,
    durationSeconds,
    isPlayingPreview,
    recordingUri,
    startRecording,
    stopRecording,
    playPreview,
    pausePreview,
    resetRecording,
  } = useVoiceRecorder();

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${rem < 10 ? "0" : ""}${rem}`;
  };

  const handleNextScript = () => {
    setScriptIndex((prev) => (prev + 1) % scriptsList.length);
  };

  const handleSkipToMain = async () => {
    await ApiClient.setOnboardingCompleted(true);
    setIsOnboarded(true);
    navigation.replace("MainTabs");
  };

  const handleConfirmVoiceGeneration = () => {
    if (!recordingUri) {
      Alert.alert("Recording Required", "Please record at least 10 seconds of audio first.");
      return;
    }

    if (durationSeconds < 8) {
      Alert.alert(
        "Recording Too Short",
        "Please speak for at least 8 to 10 seconds so Nila can capture your warm bedtime tone."
      );
      return;
    }

    // Automatically route engine without bothering parent:
    // Sarvam for Indic languages (Tamil, Hindi, Telugu, Kannada, Malayalam); ElevenLabs for English
    const chosenProvider = userLanguage === "English" ? "elevenlabs" : "sarvam";
    const finalName = voiceName.trim() || defaultVoiceName;

    logger.info(
      "VOICE",
      `[VoiceRecordingScreen] Starting voice synthesis: "${finalName}" | provider=${chosenProvider}`
    );

    navigation.navigate("VoiceProcessing", {
      recordingUri,
      parentId: parent.id,
      displayName: finalName,
      relationship: parent.relationship || "Parent",
      provider: chosenProvider,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {isOnboarded ? (
        <NilaHeader
          title="Record Bedtime Voice"
          subtitle="Speak naturally with your warm, soothing bedtime tone."
          onBack={() => navigation.goBack()}
        />
      ) : (
        <OnboardingHeader
          step={4}
          totalSteps={4}
          title="Record your bedtime voice"
          subtitle="Don't try to sound like a voice actor. Just speak the way you comfort your child at night."
          onBack={() => navigation.goBack()}
          onSkip={handleSkipToMain}
          skipLabel="Skip for now"
        />
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Script Card */}
        <View style={styles.scriptCard}>
          <View style={styles.scriptCardTop}>
            <View style={styles.scriptBadge}>
              <Text style={styles.scriptBadgeText}>{userLanguage} Bedtime Script</Text>
            </View>

            {/* Script Display Toggle: Native vs English Alphabet */}
            {userLanguage !== "English" && (
              <View style={styles.scriptToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.togglePill,
                    scriptMode === "native" && styles.togglePillActive,
                  ]}
                  onPress={() => setScriptMode("native")}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.togglePillText,
                      scriptMode === "native" && styles.togglePillTextActive,
                    ]}
                  >
                    Script
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.togglePill,
                    scriptMode === "phonetic" && styles.togglePillActive,
                  ]}
                  onPress={() => setScriptMode("phonetic")}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.togglePillText,
                      scriptMode === "phonetic" && styles.togglePillTextActive,
                    ]}
                  >
                    English Letters
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Text style={styles.scriptTitle}>{activeScript.title}</Text>
          <Text style={styles.scriptBody}>
            {scriptMode === "native" ? activeScript.native : activeScript.phonetic}
          </Text>

          {activeScript.meaning ? (
            <View style={styles.meaningBox}>
              <Ionicons name="sparkles-outline" size={13} color={NilaColors.gold} />
              <Text style={styles.meaningText}>{activeScript.meaning}</Text>
            </View>
          ) : null}

          {scriptsList.length > 1 && (
            <TouchableOpacity
              style={styles.refreshScriptRow}
              onPress={handleNextScript}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={14} color={NilaColors.gold} />
              <Text style={styles.refreshScriptText}>Try another story passage</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Recorder Centerpiece */}
        <View style={styles.recorderContainer}>
          {state === "recording" ? (
            <TouchableOpacity
              style={[styles.micCircle, styles.micCircleRecording]}
              onPress={stopRecording}
              activeOpacity={0.8}
            >
              <Ionicons name="stop" size={32} color={NilaColors.midnight} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.micCircle,
                state === "recorded" && styles.micCircleRecorded,
              ]}
              onPress={startRecording}
              activeOpacity={0.8}
            >
              <Ionicons
                name="mic"
                size={34}
                color={state === "recorded" ? NilaColors.emerald : NilaColors.gold}
              />
            </TouchableOpacity>
          )}

          <View style={styles.statusRow}>
            {state === "recording" && <View style={styles.recordingDot} />}
            <Text style={styles.timerText}>
              {state === "recording"
                ? `Recording... ${formatTime(durationSeconds)} (Target: 10s-15s)`
                : state === "recorded"
                ? `Captured: ${formatTime(durationSeconds)}`
                : "Tap the microphone when you're ready"}
            </Text>
          </View>

          {/* Playback Controls when Recorded */}
          {state === "recorded" && (
            <View style={styles.playbackControls}>
              <TouchableOpacity
                style={styles.controlPill}
                onPress={resetRecording}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={16} color={NilaColors.textSecondary} />
                <Text style={styles.controlPillText}>Re-record</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlPill, styles.controlPillPrimary]}
                onPress={isPlayingPreview ? pausePreview : playPreview}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isPlayingPreview ? "pause" : "play"}
                  size={16}
                  color={NilaColors.textDark}
                />
                <Text style={styles.controlPillTextPrimary}>
                  {isPlayingPreview ? "Pause" : "Listen Preview"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Voice Profile Name Input */}
          {state === "recorded" && (
            <View style={styles.voiceNameCard}>
              <View style={styles.voiceNameHeader}>
                <Ionicons name="pencil" size={14} color={NilaColors.gold} />
                <Text style={styles.voiceNameLabel}>Voice Name</Text>
              </View>
              <TextInput
                style={styles.voiceNameInput}
                value={voiceName}
                onChangeText={setVoiceName}
                placeholder="e.g. Mother's Voice, David's Voice"
                placeholderTextColor={NilaColors.textMuted}
                autoCapitalize="words"
                maxLength={30}
              />
            </View>
          )}
        </View>

        {/* CTA Buttons */}
        <View style={styles.bottomCtaContainer}>
          <NilaButton
            title={
              state === "recorded"
                ? "Create My Bedtime Voice"
                : state === "recording"
                ? "Finish Recording"
                : "Start Recording (15s)"
            }
            onPress={
              state === "recorded"
                ? handleConfirmVoiceGeneration
                : state === "recording"
                ? stopRecording
                : startRecording
            }
            style={styles.actionButton}
          />

          <TouchableOpacity
            style={styles.skipLink}
            onPress={handleSkipToMain}
            activeOpacity={0.7}
          >
            <Text style={styles.skipLinkText}>
              Skip and use Nila's gentle storyteller voice for now
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingBottom: 40,
  },
  scriptCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 24,
  },
  scriptCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  scriptBadge: {
    backgroundColor: "rgba(245, 199, 106, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  scriptBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: NilaColors.gold,
    letterSpacing: 0.5,
  },
  scriptToggleRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 10,
    padding: 2,
  },
  togglePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  togglePillActive: {
    backgroundColor: "rgba(245, 199, 106, 0.2)",
  },
  togglePillText: {
    fontSize: 11,
    color: NilaColors.textMuted,
    fontWeight: "500",
  },
  togglePillTextActive: {
    color: NilaColors.gold,
    fontWeight: "700",
  },
  scriptTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: NilaColors.textPrimary,
    marginBottom: 8,
  },
  scriptBody: {
    fontSize: 15,
    color: NilaColors.textPrimary,
    lineHeight: 24,
    marginBottom: 12,
  },
  meaningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 10,
    borderRadius: 10,
    gap: 8,
    marginBottom: 12,
  },
  meaningText: {
    flex: 1,
    fontSize: 12,
    color: NilaColors.textMuted,
    lineHeight: 16,
  },
  refreshScriptRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
  },
  refreshScriptText: {
    fontSize: 12,
    color: NilaColors.gold,
    fontWeight: "600",
  },
  recorderContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  micCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(245, 199, 106, 0.12)",
    borderWidth: 2,
    borderColor: NilaColors.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  micCircleRecording: {
    backgroundColor: NilaColors.gold,
    borderColor: "#FFF",
  },
  micCircleRecorded: {
    borderColor: NilaColors.emerald,
    backgroundColor: "rgba(52, 211, 153, 0.12)",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF5252",
  },
  timerText: {
    fontSize: 13,
    color: NilaColors.textMuted,
  },
  playbackControls: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  controlPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  controlPillPrimary: {
    backgroundColor: NilaColors.gold,
  },
  controlPillText: {
    fontSize: 13,
    color: NilaColors.textPrimary,
    fontWeight: "600",
  },
  controlPillTextPrimary: {
    fontSize: 13,
    color: NilaColors.textDark,
    fontWeight: "700",
  },
  voiceNameCard: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  voiceNameHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  voiceNameLabel: {
    fontSize: 12,
    color: NilaColors.gold,
    fontWeight: "700",
  },
  voiceNameInput: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: NilaColors.textPrimary,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  bottomCtaContainer: {
    gap: 12,
  },
  actionButton: {
    width: "100%",
  },
  skipLink: {
    alignItems: "center",
    paddingVertical: 10,
  },
  skipLinkText: {
    fontSize: 13,
    color: NilaColors.textMuted,
    textAlign: "center",
  },
});
