import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { AudioPlayerController, AudioPlayerState } from "../../hooks/useAudioPlayer";

interface AudioPlayerProps {
  controller: AudioPlayerController;
  playerState: AudioPlayerState;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ controller, playerState }) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progress =
    playerState.durationSeconds > 0
      ? Math.min(1, playerState.positionSeconds / playerState.durationSeconds)
      : 0;

  return (
    <View style={styles.card}>
      <Text style={styles.header}>✨ Bedtime Audio Story</Text>

      {/* Progress Bar */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatTime(playerState.positionSeconds)}</Text>
        <Text style={styles.timeText}>{formatTime(playerState.durationSeconds)}</Text>
      </View>

      {/* Player Controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => controller.replay()}>
          <Text style={styles.secondaryButtonText}>⏮ Replay</Text>
        </TouchableOpacity>

        {playerState.isBuffering ? (
          <View style={styles.playButton}>
            <ActivityIndicator color="#FFFFFF" size="small" />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => (playerState.isPlaying ? controller.pause() : controller.play())}
          >
            <Text style={styles.playButtonText}>{playerState.isPlaying ? "⏸" : "▶"}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.secondaryButton} onPress={() => controller.stop()}>
          <Text style={styles.secondaryButtonText}>⏹ Stop</Text>
        </TouchableOpacity>
      </View>

      {playerState.error && <Text style={styles.errorText}>{playerState.error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 20,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  header: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 16,
    textAlign: "center",
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: "#334155",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#38BDF8",
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  timeText: {
    fontSize: 12,
    color: "#94A3B8",
    fontVariant: ["tabular-nums"],
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#38BDF8",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  playButtonText: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "700",
    marginLeft: 2,
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#334155",
  },
  secondaryButtonText: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "600",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 10,
    textAlign: "center",
  },
});
