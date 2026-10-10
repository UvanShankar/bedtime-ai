import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NilaColors } from "../../theme/colors";
import { NilaButton } from "../../components/common/NilaButton";
import { useNila } from "../../context/NilaContext";

interface Props {
  navigation: any;
}

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { parent, selectedChild, stories } = useNila();

  const lastStory = stories[0] || {
    id: "story-elephant-01",
    title: "The Little Elephant Who Couldn't Sleep",
    audioDurationSeconds: 302,
    narratorName: "Dad's Voice",
  };

  const formatDuration = (secs?: number) => {
    if (!secs) return "5 min";
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? "0" : ""}${rem}`;
  };

  const handlePlayStory = (storyToPlay: any) => {
    navigation.navigate("StoryPlayer", { story: storyToPlay });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingTitle}>
              Good evening, {parent?.name || "Uvan"} 🌙
            </Text>
            <Text style={styles.greetingSubtitle}>How shall we dream tonight?</Text>
          </View>

          <TouchableOpacity
            style={styles.childBadge}
            onPress={() => navigation.navigate("ChildProfile")}
            activeOpacity={0.8}
          >
            <Text style={styles.childAvatarEmoji}>👦🏽</Text>
            <Text style={styles.childBadgeText}>{selectedChild?.name || "Kanna"}</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Card: Create tonight's story */}
        <View style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <View style={styles.magicBadge}>
            <Ionicons name="sparkles" size={13} color={NilaColors.gold} />
            <Text style={styles.magicBadgeText}>Magic Generator</Text>
          </View>

          <Text style={styles.heroMoon}>☾</Text>
          <Text style={styles.heroTitle}>Create tonight's story</Text>
          <Text style={styles.heroSubtitle}>
            A new custom bedtime adventure for {selectedChild?.name || "Kanna"}.
          </Text>

          <NilaButton
            title="Create Story"
            onPress={() => navigation.navigate("StoryRequest")}
            style={styles.heroButton}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionPill}
            onPress={() => navigation.navigate("AddMemory")}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={18} color={NilaColors.gold} />
            <Text style={styles.quickActionText}>Add Memory</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionPill}
            onPress={() => navigation.navigate("VoiceProfile")}
            activeOpacity={0.8}
          >
            <Ionicons name="mic-outline" size={18} color={NilaColors.gold} />
            <Text style={styles.quickActionText}>Manage Voices</Text>
          </TouchableOpacity>
        </View>

        {/* Continue Listening */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Continue listening</Text>
        </View>

        <TouchableOpacity
          style={styles.continueCard}
          onPress={() => handlePlayStory(lastStory)}
          activeOpacity={0.85}
        >
          <View style={styles.storyCoverThumbnail}>
            <Text style={styles.storyCoverMoon}>☾</Text>
          </View>
          <View style={styles.continueDetails}>
            <Text style={styles.continueTitle} numberOfLines={1}>
              {lastStory.title}
            </Text>
            <Text style={styles.continueMeta}>
              {formatDuration(lastStory.audioDurationSeconds)} · {lastStory.narratorName || "Dad's Voice"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.playCircle}
            onPress={() => handlePlayStory(lastStory)}
            activeOpacity={0.8}
          >
            <Ionicons name="play" size={18} color={NilaColors.midnight} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Suggested for Child */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Suggested for {selectedChild?.name || "Kanna"}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestedScroll}>
          <TouchableOpacity
            style={styles.suggestedCard}
            onPress={() =>
              navigation.navigate("StoryRequest", {
                suggestedTopic: "The Cozy Train that found its way home",
                suggestedType: "Bedtime Adventure",
              })
            }
            activeOpacity={0.85}
          >
            <View style={styles.suggestedArt1}>
              <Text style={styles.suggestedEmoji}>🚂</Text>
            </View>
            <Text style={styles.suggestedTitle}>The Cozy Train</Text>
            <Text style={styles.suggestedSub}>3 min · Soft & peaceful</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.suggestedCard}
            onPress={() =>
              navigation.navigate("StoryRequest", {
                suggestedTopic: "Luna's Lantern glowing in the dark forest",
                suggestedType: "Magical",
              })
            }
            activeOpacity={0.85}
          >
            <View style={styles.suggestedArt2}>
              <Text style={styles.suggestedEmoji}>🏮</Text>
            </View>
            <Text style={styles.suggestedTitle}>Luna's Lantern</Text>
            <Text style={styles.suggestedSub}>5 min · Sleepy fantasy</Text>
          </TouchableOpacity>
        </ScrollView>
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
    paddingTop: 12,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: NilaColors.textPrimary,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: NilaColors.textSecondary,
    marginTop: 2,
  },
  childBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: NilaColors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    gap: 6,
  },
  childAvatarEmoji: {
    fontSize: 14,
  },
  childBadgeText: {
    color: NilaColors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  heroCard: {
    backgroundColor: NilaColors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    marginBottom: 16,
    position: "relative",
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(245, 199, 106, 0.04)",
    top: -50,
  },
  magicBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: NilaColors.goldMuted,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
    marginBottom: 16,
  },
  magicBadgeText: {
    color: NilaColors.gold,
    fontSize: 12,
    fontWeight: "700",
  },
  heroMoon: {
    fontSize: 54,
    color: NilaColors.gold,
    marginBottom: 10,
    textShadowColor: NilaColors.goldGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: NilaColors.textPrimary,
    marginBottom: 6,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 14,
    color: NilaColors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  heroButton: {
    width: "100%",
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  quickActionPill: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: NilaColors.surface,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  quickActionText: {
    color: NilaColors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: NilaColors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  continueCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: NilaColors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    marginBottom: 24,
  },
  storyCoverThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: NilaColors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    borderWidth: 1,
    borderColor: NilaColors.goldMuted,
  },
  storyCoverMoon: {
    fontSize: 22,
    color: NilaColors.gold,
  },
  continueDetails: {
    flex: 1,
    paddingRight: 10,
  },
  continueTitle: {
    color: NilaColors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  continueMeta: {
    color: NilaColors.textSecondary,
    fontSize: 12,
  },
  playCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NilaColors.gold,
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 2,
  },
  suggestedScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  suggestedCard: {
    width: 170,
    backgroundColor: NilaColors.surface,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    marginRight: 14,
  },
  suggestedArt1: {
    height: 100,
    borderRadius: 12,
    backgroundColor: "#1B2A4A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  suggestedArt2: {
    height: 100,
    borderRadius: 12,
    backgroundColor: "#2E2442",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  suggestedEmoji: {
    fontSize: 36,
  },
  suggestedTitle: {
    color: NilaColors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 3,
  },
  suggestedSub: {
    color: NilaColors.textMuted,
    fontSize: 12,
  },
});
