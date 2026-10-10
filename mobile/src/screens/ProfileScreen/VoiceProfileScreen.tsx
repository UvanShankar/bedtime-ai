import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NilaColors } from "../../theme/colors";
import { NilaHeader } from "../../components/common/NilaHeader";
import { NilaButton } from "../../components/common/NilaButton";
import { useNila } from "../../context/NilaContext";
import { useAudioPlayer } from "../../hooks/useAudioPlayer";
import { logger } from "../../utils/logger";

interface Props {
  navigation: any;
}

export const VoiceProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { voiceProfile, deleteVoiceProfile } = useNila();
  const { state: audioState, controller } = useAudioPlayer();

  const handlePreview = async () => {
    const audioUrl =
      (voiceProfile as any)?.previewAudioUrl ||
      (voiceProfile?.sourceAudioKey && (voiceProfile.sourceAudioKey.startsWith("file") || voiceProfile.sourceAudioKey.startsWith("http"))
        ? voiceProfile.sourceAudioKey
        : null);

    if (!audioUrl) {
      logger.warn("VOICE", "[VoiceProfileScreen] No preview audio URL available");
      Alert.alert("Playback Error", "No audio recording found for this voice profile.");
      return;
    }

    try {
      if (audioState.isPlaying) {
        await controller.pause();
      } else {
        logger.info("VOICE", `[VoiceProfileScreen] Playing preview audio: ${audioUrl}`);
        await controller.load(audioUrl);
        await controller.play();
      }
    } catch (err: any) {
      logger.error("VOICE", `[VoiceProfileScreen] Preview error: ${err.message}`, err);
      Alert.alert("Playback Error", "Could not play sample audio: " + err.message);
    }
  };

  const handleReRecord = () => {
    navigation.navigate("VoiceRecording");
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Voice Profile?",
      "Your cloned voice will no longer be available for new stories.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Voice",
          style: "destructive",
          onPress: () => {
            deleteVoiceProfile();
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <NilaHeader title="Voice Profile" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Voice Card Centerpiece */}
        <View style={styles.heroCard}>
          <View style={styles.micCircle}>
            <Ionicons name="mic" size={32} color={NilaColors.gold} />
          </View>
          <Text style={styles.voiceName}>
            {voiceProfile?.displayName || `${parent?.name || "Dad"}'s Voice Clone`}
          </Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {voiceProfile?.status?.toUpperCase() || "READY"} • {voiceProfile?.provider?.toUpperCase() || "SARVAM"}
            </Text>
          </View>
        </View>

        {/* Voice Properties Table */}
        <Text style={styles.sectionHeader}>VOICE PROPERTIES</Text>
        <View style={styles.propertiesCard}>
          <View style={styles.propRow}>
            <Text style={styles.propLabel}>Accent / Dialect</Text>
            <Text style={styles.propValue}>
              {voiceProfile?.accentDialect || "Southern Indian (English)"}
            </Text>
          </View>
          <View style={styles.propDivider} />

          <View style={styles.propRow}>
            <Text style={styles.propLabel}>Language Support</Text>
            <Text style={styles.propValue}>English, Tamil, Hindi</Text>
          </View>
          <View style={styles.propDivider} />

          <View style={styles.propRow}>
            <Text style={styles.propLabel}>Sample Duration</Text>
            <Text style={styles.propValue}>
              {voiceProfile?.sampleDuration || "3 minutes (High Fidelity)"}
            </Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.actionsContainer}>
          <NilaButton
            title="Preview Bedtime Greeting"
            onPress={handlePreview}
            icon={<Ionicons name="play" size={16} color={NilaColors.textDark} />}
            style={styles.actionBtn}
          />
          <NilaButton
            title="Re-record Voice Sample"
            variant="secondary"
            onPress={handleReRecord}
            icon={<Ionicons name="refresh" size={16} color={NilaColors.textPrimary} />}
            style={styles.actionBtn}
          />
          <NilaButton
            title="Delete Voice Profile"
            variant="danger"
            onPress={handleDelete}
            style={styles.actionBtn}
          />
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
  heroCard: {
    backgroundColor: NilaColors.surface,
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    marginBottom: 28,
  },
  micCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: NilaColors.surfaceLight,
    borderWidth: 1.5,
    borderColor: NilaColors.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  voiceName: {
    fontSize: 20,
    fontWeight: "800",
    color: NilaColors.textPrimary,
    marginBottom: 10,
  },
  statusBadge: {
    backgroundColor: NilaColors.emeraldMuted,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: NilaColors.emerald,
  },
  statusText: {
    color: NilaColors.emerald,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  sectionHeader: {
    color: NilaColors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  propertiesCard: {
    backgroundColor: NilaColors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    marginBottom: 32,
  },
  propRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  propDivider: {
    height: 1,
    backgroundColor: NilaColors.cardBorderSubtle,
  },
  propLabel: {
    color: NilaColors.textMuted,
    fontSize: 14,
  },
  propValue: {
    color: NilaColors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  actionsContainer: {
    gap: 12,
  },
  actionBtn: {
    width: "100%",
  },
});
