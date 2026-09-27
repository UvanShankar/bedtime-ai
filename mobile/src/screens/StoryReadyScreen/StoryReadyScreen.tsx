import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NilaColors } from "../../theme/colors";
import { NilaButton } from "../../components/common/NilaButton";
import { useNila } from "../../context/NilaContext";

interface Props {
  route: any;
  navigation: any;
}

export const StoryReadyScreen: React.FC<Props> = ({ route, navigation }) => {
  const { selectedChild } = useNila();
  const { story } = route.params || {};

  const handleListen = () => {
    navigation.replace("StoryPlayer", { story });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.starCircle}>
          <Text style={styles.starIcon}>✦</Text>
        </View>

        <Text style={styles.headerTitle}>
          {selectedChild?.name || "Aarav"}'s story is ready
        </Text>
        <Text style={styles.headerSubtitle}>Ready to light up tonight's dreams.</Text>

        {/* Story Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.storyTitle}>
            {story?.title?.toUpperCase() || "THE LITTLE ELEPHANT WHO COULDN'T SLEEP"}
          </Text>

          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={16} color={NilaColors.textMuted} />
            <Text style={styles.metaText}>
              {story?.audioDurationSeconds
                ? `${Math.round(story.audioDurationSeconds / 60)} minutes`
                : "5 minutes"}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="mic-outline" size={16} color={NilaColors.textMuted} />
            <Text style={styles.metaText}>
              {story?.narratorStyle
                ? `Told in ${story.narratorName || "Dad's voice"} · ${story.narratorStyle}`
                : "Told in Dad's voice · Tamil · Chennai style"}
            </Text>
          </View>

          {story?.inspiredByMemory && (
            <View style={styles.memoryRow}>
              <Ionicons name="sparkles" size={15} color={NilaColors.gold} />
              <Text style={styles.memoryText}>
                Inspired by a memory from {story.inspiredByMemory}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <NilaButton
          title="▶  Listen"
          onPress={handleListen}
          style={styles.listenButton}
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
  starCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(245, 199, 106, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  starIcon: {
    fontSize: 40,
    color: NilaColors.gold,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: NilaColors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    color: NilaColors.textSecondary,
    marginBottom: 32,
    textAlign: "center",
  },
  summaryCard: {
    width: "100%",
    backgroundColor: NilaColors.surface,
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    alignItems: "center",
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: NilaColors.textPrimary,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 26,
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  metaText: {
    color: NilaColors.textSecondary,
    fontSize: 14,
  },
  memoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    backgroundColor: NilaColors.goldMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  memoryText: {
    color: NilaColors.gold,
    fontSize: 13,
    fontWeight: "600",
  },
  footer: {
    paddingBottom: 36,
  },
  listenButton: {
    width: "100%",
  },
});
