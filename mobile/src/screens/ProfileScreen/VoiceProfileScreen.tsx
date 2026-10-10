import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NilaColors } from "../../theme/colors";
import { NilaHeader } from "../../components/common/NilaHeader";
import { NilaButton } from "../../components/common/NilaButton";
import { useNila } from "../../context/NilaContext";
import { useAudioPlayer } from "../../hooks/useAudioPlayer";
import { logger } from "../../utils/logger";
import { VoiceProfile } from "../../models";

interface Props {
  navigation: any;
}

export const VoiceProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { parent, voiceProfile, setVoiceProfile, voiceProfiles, deleteVoiceProfile, refreshVoicesFromBackend } = useNila();
  const { state: audioState, controller } = useAudioPlayer();
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  useEffect(() => {
    refreshVoicesFromBackend().catch(() => {});
  }, []);

  const handleTogglePreview = async (profile: VoiceProfile) => {
    const audioUrl =
      profile.previewAudioUrl ||
      (profile.sourceAudioKey && (profile.sourceAudioKey.startsWith("file") || profile.sourceAudioKey.startsWith("http"))
        ? profile.sourceAudioKey
        : null);

    if (!audioUrl) {
      logger.warn("VOICE", `[VoiceProfileScreen] No preview audio URL available for ${profile.displayName}`);
      Alert.alert("Playback Error", "No audio recording found for this voice profile.");
      return;
    }

    try {
      if (playingVoiceId === profile.id && audioState.isPlaying) {
        await controller.pause();
        setPlayingVoiceId(null);
      } else {
        logger.info("VOICE", `[VoiceProfileScreen] Playing preview audio for ${profile.displayName}: ${audioUrl}`);
        setPlayingVoiceId(profile.id);
        await controller.load(audioUrl);
        await controller.play();
      }
    } catch (err: any) {
      logger.error("VOICE", `[VoiceProfileScreen] Preview error: ${err.message}`, err);
      Alert.alert("Playback Error", "Could not play sample audio: " + err.message);
    }
  };

  const handleRecordNew = () => {
    controller.stop().catch(() => {});
    navigation.navigate("VoiceRecording");
  };

  const handleDelete = (targetVoice: VoiceProfile) => {
    Alert.alert(
      "Delete Voice Profile?",
      `Are you sure you want to delete "${targetVoice.displayName || "this voice"}"? It will no longer be available for stories.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Voice",
          style: "destructive",
          onPress: () => {
            if (playingVoiceId === targetVoice.id) {
              controller.stop().catch(() => {});
              setPlayingVoiceId(null);
            }
            deleteVoiceProfile(targetVoice.id);
          },
        },
      ]
    );
  };

  const activeVoiceList = voiceProfiles && voiceProfiles.length > 0
    ? voiceProfiles
    : (voiceProfile && voiceProfile.id !== "voc_default_priya" ? [voiceProfile] : []);

  return (
    <SafeAreaView style={styles.container}>
      <NilaHeader
        title="Voice Profiles"
        onBack={() => {
          controller.stop().catch(() => {});
          navigation.goBack();
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Active Hero Card */}
        {voiceProfile && (
          <View style={styles.heroCard}>
            <View style={styles.micCircle}>
              <Ionicons name="mic" size={32} color={NilaColors.gold} />
            </View>
            <Text style={styles.voiceName}>
              {voiceProfile.displayName || `${parent?.name || "Parent"}'s Voice`}
            </Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {voiceProfile.status?.toUpperCase() || "READY"} • {(voiceProfile.provider || "sarvam").toUpperCase() === "ELEVENLABS" ? "🌐 ELEVENLABS" : "⚡ SARVAM AI"}
              </Text>
            </View>
          </View>
        )}

        {/* Cloned Voices List */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.sectionHeader}>YOUR CLONED VOICES ({activeVoiceList.length})</Text>
          <TouchableOpacity
            style={styles.addVoiceButton}
            onPress={handleRecordNew}
            activeOpacity={0.7}
          >
            <Text style={styles.addVoiceButtonText}>+ Record New</Text>
          </TouchableOpacity>
        </View>

        {activeVoiceList.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No custom voices cloned yet.</Text>
            <NilaButton
              title="Record Your Voice Now"
              onPress={handleRecordNew}
              icon={<Ionicons name="mic" size={16} color={NilaColors.textDark} />}
              style={styles.emptyButton}
            />
          </View>
        ) : (
          <View style={styles.voiceListContainer}>
            {activeVoiceList.map((voice) => {
              const isActive = voiceProfile?.id === voice.id;
              const isPlaying = playingVoiceId === voice.id && audioState.isPlaying;
              const providerLower = (voice.provider || "sarvam").toLowerCase();

              return (
                <TouchableOpacity
                  key={voice.id}
                  style={[styles.voiceItemCard, isActive && styles.voiceItemCardActive]}
                  onPress={() => setVoiceProfile(voice)}
                  activeOpacity={0.8}
                >
                  <View style={styles.voiceItemLeft}>
                    <View style={[styles.avatarCircle, isActive && styles.avatarCircleActive]}>
                      <Ionicons name="mic" size={18} color={isActive ? NilaColors.gold : NilaColors.textMuted} />
                    </View>
                    <View style={styles.voiceItemInfo}>
                      <View style={styles.voiceItemTitleRow}>
                        <Text style={[styles.voiceItemName, isActive && styles.voiceItemNameActive]}>
                          {voice.displayName || "Parent Voice"}
                        </Text>
                        <View style={[styles.engineBadge, providerLower === "elevenlabs" ? styles.engineBadgeEleven : styles.engineBadgeSarvam]}>
                          <Text style={styles.engineBadgeText}>
                            {providerLower === "elevenlabs" ? "🌐 ElevenLabs" : "⚡ Sarvam AI"}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.voiceItemSub}>
                        {voice.accentDialect || "Tamil · Bedtime tone"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.voiceItemRight}>
                    <TouchableOpacity
                      style={[styles.previewCircle, isPlaying && styles.previewCircleActive]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleTogglePreview(voice);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={isPlaying ? "pause" : "play"}
                        size={14}
                        color={isPlaying ? NilaColors.midnight : NilaColors.gold}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteCircle}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDelete(voice);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={16} color={NilaColors.coral} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Global Action Buttons */}
        <View style={styles.actionsContainer}>
          <NilaButton
            title="+ Add Another Voice Clone"
            variant="secondary"
            onPress={handleRecordNew}
            icon={<Ionicons name="mic-outline" size={16} color={NilaColors.textPrimary} />}
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
    marginBottom: 24,
  },
  micCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: NilaColors.surfaceLight,
    borderWidth: 1.5,
    borderColor: NilaColors.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
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
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  sectionHeader: {
    color: NilaColors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  addVoiceButton: {
    backgroundColor: NilaColors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
  },
  addVoiceButtonText: {
    color: NilaColors.gold,
    fontSize: 12,
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: NilaColors.surface,
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
  },
  emptyText: {
    color: NilaColors.textMuted,
    fontSize: 14,
    marginBottom: 16,
  },
  emptyButton: {
    width: "100%",
  },
  voiceListContainer: {
    gap: 12,
    marginBottom: 24,
  },
  voiceItemCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: NilaColors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
  },
  voiceItemCardActive: {
    borderColor: NilaColors.gold,
    backgroundColor: NilaColors.surfaceLight,
  },
  voiceItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: NilaColors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarCircleActive: {
    backgroundColor: "rgba(242, 201, 76, 0.15)",
    borderWidth: 1,
    borderColor: NilaColors.gold,
  },
  voiceItemInfo: {
    flex: 1,
  },
  voiceItemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
    flexWrap: "wrap",
  },
  voiceItemName: {
    fontSize: 15,
    fontWeight: "700",
    color: NilaColors.textPrimary,
  },
  voiceItemNameActive: {
    color: NilaColors.gold,
  },
  engineBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  engineBadgeEleven: {
    backgroundColor: "rgba(100, 181, 246, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(100, 181, 246, 0.3)",
  },
  engineBadgeSarvam: {
    backgroundColor: "rgba(242, 201, 76, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(242, 201, 76, 0.3)",
  },
  engineBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: NilaColors.textPrimary,
  },
  voiceItemSub: {
    fontSize: 12,
    color: NilaColors.textMuted,
  },
  voiceItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginLeft: 8,
  },
  previewCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: NilaColors.surfaceLight,
    borderWidth: 1,
    borderColor: NilaColors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  previewCircleActive: {
    backgroundColor: NilaColors.gold,
  },
  deleteCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionsContainer: {
    marginTop: 8,
  },
  actionBtn: {
    width: "100%",
  },
});
