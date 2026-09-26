import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { RecorderState } from "../../hooks/useVoiceRecorder";

interface VoiceRecorderProps {
  state: RecorderState;
  durationSeconds: number;
  isPlayingPreview: boolean;
  onStartRecord: () => void;
  onStopRecord: () => void;
  onPlayPreview: () => void;
  onPausePreview: () => void;
  onReset: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  state,
  durationSeconds,
  isPlayingPreview,
  onStartRecord,
  onStopRecord,
  onPlayPreview,
  onPausePreview,
  onReset,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.timerText}>{formatTime(durationSeconds)}</Text>
      <Text style={styles.statusText}>
        {state === "idle" && "Tap the microphone to begin reading your sample"}
        {state === "recording" && "Recording in progress... Speak naturally & warmly"}
        {state === "recorded" && "Sample recorded! Preview or re-record below"}
        {state === "uploading" && "Uploading voice sample securely..."}
        {state === "processing" && "Analyzing speech style & creating voice profile..."}
        {state === "ready" && "Voice profile ready!"}
        {state === "error" && "An error occurred with the recording"}
      </Text>

      <View style={styles.controlsRow}>
        {state === "idle" && (
          <TouchableOpacity style={[styles.mainButton, styles.recordButton]} onPress={onStartRecord}>
            <Text style={styles.buttonText}>🎤 Start Recording</Text>
          </TouchableOpacity>
        )}

        {state === "recording" && (
          <TouchableOpacity style={[styles.mainButton, styles.stopButton]} onPress={onStopRecord}>
            <Text style={styles.buttonText}>⏹ Stop Recording</Text>
          </TouchableOpacity>
        )}

        {state === "recorded" && (
          <View style={styles.playbackRow}>
            <TouchableOpacity
              style={[styles.smallButton, styles.previewButton]}
              onPress={isPlayingPreview ? onPausePreview : onPlayPreview}
            >
              <Text style={styles.buttonText}>
                {isPlayingPreview ? "⏸ Pause Preview" : "▶ Listen Sample"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.smallButton, styles.resetButton]} onPress={onReset}>
              <Text style={styles.buttonText}>🔄 Re-record</Text>
            </TouchableOpacity>
          </View>
        )}

        {(state === "uploading" || state === "processing") && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#38BDF8" />
            <Text style={styles.subtext}>Please wait a moment...</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  timerText: {
    fontSize: 40,
    fontWeight: "700",
    color: "#38BDF8",
    fontVariant: ["tabular-nums"],
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 20,
    minHeight: 36,
  },
  controlsRow: {
    width: "100%",
    alignItems: "center",
  },
  mainButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: "80%",
    alignItems: "center",
    elevation: 3,
  },
  recordButton: {
    backgroundColor: "#EF4444",
  },
  stopButton: {
    backgroundColor: "#F59E0B",
  },
  playbackRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    justifyContent: "center",
  },
  smallButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    flex: 1,
    alignItems: "center",
  },
  previewButton: {
    backgroundColor: "#2563EB",
  },
  resetButton: {
    backgroundColor: "#475569",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  subtext: {
    color: "#94A3B8",
    marginTop: 8,
    fontSize: 13,
  },
});
