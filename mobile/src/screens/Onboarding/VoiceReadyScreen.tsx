import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NilaColors } from "../../theme/colors";
import { NilaButton } from "../../components/common/NilaButton";
import { useNila } from "../../context/NilaContext";
import { useAudioPlayer } from "../../hooks/useAudioPlayer";

interface Props {
  navigation: any;
}

export const VoiceReadyScreen: React.FC<Props> = ({ navigation }) => {
  const { voiceProfile } = useNila();
  const { controller } = useAudioPlayer();
  const [isPlaying, setIsPlaying] = useState(false);

  const sampleAudioUrl =
    voiceProfile?.sourceAudioKey && voiceProfile.sourceAudioKey.startsWith("http")
      ? voiceProfile.sourceAudioKey
      : "https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg";

  const handleTogglePreview = async () => {
    if (isPlaying) {
      await controller.pause();
      setIsPlaying(false);
    } else {
      await controller.load(sampleAudioUrl);
      await controller.play();
      setIsPlaying(true);
    }
  };

  const handleTryStory = () => {
    controller.stop().catch(() => {});
    navigation.navigate("StoryRequest");
  };

  const handleGoHome = () => {
    controller.stop().catch(() => {});
    navigation.navigate("MainTabs", { screen: "Home" });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.illustrationWrapper}>
          <Text style={styles.starIcon}>✦</Text>
        </View>

        <Text style={styles.title}>Your voice is ready.</Text>
        <Text style={styles.subtitle}>
          Nila can now tell bedtime stories the way you would. Always warm, familiar, and close.
        </Text>

        {/* Audio Sample Pill */}
        <TouchableOpacity
          style={styles.samplePill}
          onPress={handleTogglePreview}
          activeOpacity={0.8}
        >
          <View style={styles.playIconCircle}>
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={18}
              color={NilaColors.textDark}
            />
          </View>
          <View style={styles.sampleInfo}>
            <Text style={styles.sampleTitle}>
              {isPlaying ? "Playing voice sample..." : "Listen to your voice sample"}
            </Text>
            <Text style={styles.sampleSub}>Tamil · Warm bedtime tone</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <NilaButton
          title="Try a story"
          onPress={handleTryStory}
          style={styles.ctaButton}
        />
        <NilaButton
          title="Go to Home"
          variant="outline"
          onPress={handleGoHome}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NilaColors.midnight,
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
  },
  illustrationWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(245, 199, 106, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  starIcon: {
    fontSize: 44,
    color: NilaColors.gold,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: NilaColors.textPrimary,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: NilaColors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  samplePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: NilaColors.surface,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    width: "100%",
    gap: 14,
  },
  playIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NilaColors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  sampleInfo: {
    flex: 1,
  },
  sampleTitle: {
    color: NilaColors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  sampleSub: {
    color: NilaColors.textMuted,
    fontSize: 12,
  },
  footer: {
    paddingBottom: 32,
  },
  ctaButton: {
    marginBottom: 14,
  },
});
