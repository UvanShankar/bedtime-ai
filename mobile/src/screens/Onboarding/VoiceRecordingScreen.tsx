import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NilaColors } from "../../theme/colors";
import { NilaHeader } from "../../components/common/NilaHeader";
import { NilaButton } from "../../components/common/NilaButton";
import { useVoiceRecorder } from "../../hooks/useVoiceRecorder";
import { VoiceApi } from "../../services/api/VoiceApi";
import { useNila } from "../../context/NilaContext";

interface Props {
  navigation: any;
}

export const VoiceRecordingScreen: React.FC<Props> = ({ navigation }) => {
  const { parent, setVoiceProfile } = useNila();

  const scripts = [
    "நிலா வானில் மெல்ல வந்து, படுக்கை அறையை தன் மென்மையான ஒளியால் நிறைத்தது. குட்டி மான் கண்ணை மூடி தூங்கியது.",
    "கண்ணா... ஒரு அழகான காட்டில் ஒரு குட்டி அணில் இருந்துச்சாம். அது தன் அம்மாவோட சேர்ந்து இனிமையான பழங்களை சாப்பிட்டுச்சாம்.",
    "அமைதியான இரவில், நட்சத்திரங்கள் வானத்தில் விளக்குகள் போல மின்னின. எல்லா குட்டி விலங்குகளும் தங்கள் கூட்டில் தூங்கின.",
  ];

  const [scriptIndex, setScriptIndex] = useState(0);

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
    setReadyState,
    setErrorState,
  } = useVoiceRecorder();

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${rem < 10 ? "0" : ""}${rem}`;
  };

  const handleNextScript = () => {
    setScriptIndex((prev) => (prev + 1) % scripts.length);
  };

  const handleCreateVoice = async () => {
    navigation.navigate("VoiceProcessing", {
      recordingUri,
      parentId: parent.id,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <NilaHeader
        title="Just talk naturally"
        subtitle="Don't try to sound perfect. Talk the way you normally talk to your child."
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Script Card */}
        <View style={styles.scriptCard}>
          <Text style={styles.scriptHeader}>Tamil Reading Script</Text>
          <Text style={styles.scriptText}>{scripts[scriptIndex]}</Text>
          <TouchableOpacity
            style={styles.refreshScriptRow}
            onPress={handleNextScript}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={15} color={NilaColors.gold} />
            <Text style={styles.refreshScriptText}>Give me another script</Text>
          </TouchableOpacity>
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
              style={[styles.micCircle, state === "recorded" && styles.micCircleRecorded]}
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
            {state === "recording" && (
              <View style={styles.recordingDot} />
            )}
            <Text style={styles.timerText}>
              {state === "recording"
                ? `Recording... ${formatTime(durationSeconds)}`
                : state === "recorded"
                ? `Recorded: ${formatTime(durationSeconds)}`
                : "Tap mic to start recording"}
            </Text>
          </View>

          {/* Action Row for Recorded state */}
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
                  {isPlayingPreview ? "Pause" : "Play preview"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Quality Indicator */}
          <View style={styles.qualityBadge}>
            <View style={styles.qualityDot} />
            <Text style={styles.qualityText}>
              Excellent recording quality (Minimal background noise)
            </Text>
          </View>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <NilaButton
          title="Create my voice"
          onPress={handleCreateVoice}
          disabled={state === "recording"}
        />
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
  scriptCard: {
    backgroundColor: NilaColors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    marginBottom: 24,
  },
  scriptHeader: {
    color: NilaColors.gold,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scriptText: {
    color: NilaColors.textPrimary,
    fontSize: 16,
    lineHeight: 26,
    fontStyle: "italic",
    marginBottom: 14,
  },
  refreshScriptRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  refreshScriptText: {
    color: NilaColors.gold,
    fontSize: 13,
    fontWeight: "600",
  },
  recorderContainer: {
    alignItems: "center",
    backgroundColor: NilaColors.surface,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    marginBottom: 20,
  },
  micCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: NilaColors.surfaceLight,
    borderWidth: 2,
    borderColor: NilaColors.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  micCircleRecording: {
    backgroundColor: NilaColors.coral,
    borderColor: NilaColors.coral,
  },
  micCircleRecorded: {
    borderColor: NilaColors.emerald,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: NilaColors.coral,
  },
  timerText: {
    color: NilaColors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  playbackControls: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  controlPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: NilaColors.surfaceLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
  },
  controlPillPrimary: {
    backgroundColor: NilaColors.gold,
    borderColor: NilaColors.gold,
  },
  controlPillText: {
    color: NilaColors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  controlPillTextPrimary: {
    color: NilaColors.textDark,
    fontSize: 13,
    fontWeight: "700",
  },
  qualityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  qualityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: NilaColors.emerald,
  },
  qualityText: {
    color: NilaColors.emerald,
    fontSize: 12,
    fontWeight: "500",
  },
  errorText: {
    color: NilaColors.coral,
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: NilaColors.cardBorderSubtle,
  },
});
