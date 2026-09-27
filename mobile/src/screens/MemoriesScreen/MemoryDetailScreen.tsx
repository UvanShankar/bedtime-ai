import React from "react";
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
import { useNila } from "../../context/NilaContext";

interface Props {
  route: any;
  navigation: any;
}

export const MemoryDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { memory } = route.params || {};
  const { deleteMemory } = useNila();

  const handleEdit = () => {
    navigation.navigate("AddMemory", { memoryToEdit: memory });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Memento",
      "Are you sure you want to remove this family memory from bedtime storytelling?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            if (memory?.id) {
              deleteMemory(memory.id);
            }
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <NilaHeader title="Memory" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header Card */}
        <View style={styles.categoryRow}>
          <Text style={styles.categoryText}>
            {memory?.category || "BEACH DAY TRIP"}
          </Text>
          <Text style={styles.dateText}>{memory?.date || "May 12, 2026"}</Text>
        </View>

        <Text style={styles.title}>{memory?.title || "Sunny beach afternoon"}</Text>

        <Text style={styles.description}>
          {memory?.description ||
            "Aarav built a giant sandcastle with a seaweed flag, then chased tiny crabs until sunset. He insisted on bringing a small jar of salty water home so the crabs wouldn't get lonely."}
        </Text>

        {/* Tagged Emotions */}
        <Text style={styles.sectionLabel}>TAGGED EMOTIONS</Text>
        <View style={styles.emotionsRow}>
          {(memory?.emotions || ["Happy", "Peaceful"]).map((emo: string) => (
            <View key={emo} style={styles.emotionPill}>
              <Text style={styles.emotionText}>{emo}</Text>
            </View>
          ))}
        </View>

        {/* Story Usage Card */}
        <View style={styles.usageCard}>
          <View style={styles.usageLeft}>
            <Text style={styles.usageLabel}>Story Usage</Text>
            <Text style={styles.usageSub}>
              Featured in {memory?.timesUsed || 3} bedtime dreams
            </Text>
          </View>
          <Text style={styles.usageMultiplier}>{memory?.timesUsed || 3}×</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <NilaButton
            title="Edit Memory Details"
            variant="secondary"
            onPress={handleEdit}
            style={styles.actionButton}
          />
          <NilaButton
            title="Delete Memento"
            variant="danger"
            onPress={handleDelete}
            style={styles.actionButton}
          />
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyRow}>
          <Ionicons name="lock-closed" size={14} color={NilaColors.textMuted} />
          <Text style={styles.privacyText}>
            Memories are securely encrypted and only accessible by your family's AI storyteller.
          </Text>
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
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryText: {
    color: NilaColors.gold,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  dateText: {
    color: NilaColors.textMuted,
    fontSize: 13,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: NilaColors.textPrimary,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
    color: NilaColors.textSecondary,
    marginBottom: 24,
  },
  sectionLabel: {
    color: NilaColors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  emotionsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  emotionPill: {
    backgroundColor: NilaColors.surface,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
  },
  emotionText: {
    color: NilaColors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  usageCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: NilaColors.surface,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    marginBottom: 32,
  },
  usageLeft: {
    flex: 1,
  },
  usageLabel: {
    color: NilaColors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  usageSub: {
    color: NilaColors.textSecondary,
    fontSize: 13,
  },
  usageMultiplier: {
    fontSize: 24,
    fontWeight: "900",
    color: NilaColors.gold,
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    width: "100%",
  },
  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
  },
  privacyText: {
    flex: 1,
    color: NilaColors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
});
