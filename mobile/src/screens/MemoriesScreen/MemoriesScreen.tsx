import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NilaColors } from "../../theme/colors";
import { NilaButton } from "../../components/common/NilaButton";
import { useNila } from "../../context/NilaContext";
import { LifeMemory } from "../../models";

interface Props {
  navigation: any;
}

export const MemoriesScreen: React.FC<Props> = ({ navigation }) => {
  const { memories, selectedChild, refreshMemoriesFromBackend } = useNila();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refreshMemoriesFromBackend().catch(() => {});
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshMemoriesFromBackend().catch(() => {});
    setRefreshing(false);
  };

  const handleCardPress = (memory: LifeMemory) => {
    navigation.navigate("MemoryDetail", { memory });
  };

  const handleEditPress = (memory: LifeMemory) => {
    navigation.navigate("AddMemory", { memoryToEdit: memory });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Little pieces of home</Text>
        <Text style={styles.headerSubtitle}>
          Save small real-life moments here. Nila will seamlessly weave them into{" "}
          {selectedChild?.name || "Aarav"}'s bedtime stories.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={NilaColors.gold}
            colors={[NilaColors.gold]}
          />
        }
      >
        {memories.map((mem) => (
          <TouchableOpacity
            key={mem.id}
            style={styles.memoryCard}
            onPress={() => handleCardPress(mem)}
            activeOpacity={0.85}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>{mem.title}</Text>
              <Text style={styles.cardDate}>{mem.date}</Text>
            </View>

            <Text style={styles.cardDesc} numberOfLines={3}>
              {mem.description}
            </Text>

            <View style={styles.cardFooter}>
              <View style={styles.usageTag}>
                <Ionicons name="sparkles" size={13} color={NilaColors.gold} />
                <Text style={styles.usageText}>Used in {mem.timesUsed || 1} stories</Text>
              </View>

              <TouchableOpacity
                onPress={() => handleEditPress(mem)}
                activeOpacity={0.7}
                style={styles.editButton}
              >
                <Text style={styles.editText}>Edit Memory</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.bottomBar}>
        <NilaButton
          title="+ Add New Memory"
          onPress={() => navigation.navigate("AddMemory")}
          style={styles.addButton}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: NilaColors.textPrimary,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: NilaColors.textSecondary,
    lineHeight: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  memoryCard: {
    backgroundColor: NilaColors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: NilaColors.textPrimary,
    flex: 1,
    paddingRight: 8,
  },
  cardDate: {
    fontSize: 12,
    color: NilaColors.textMuted,
    fontWeight: "500",
  },
  cardDesc: {
    fontSize: 14,
    color: NilaColors.textSecondary,
    lineHeight: 21,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: NilaColors.cardBorderSubtle,
    paddingTop: 12,
  },
  usageTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  usageText: {
    color: NilaColors.textMuted,
    fontSize: 12,
    fontWeight: "500",
  },
  editButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editText: {
    color: NilaColors.gold,
    fontSize: 13,
    fontWeight: "600",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "rgba(8, 13, 26, 0.95)",
    borderTopWidth: 1,
    borderTopColor: NilaColors.cardBorderSubtle,
  },
  addButton: {
    width: "100%",
  },
});
