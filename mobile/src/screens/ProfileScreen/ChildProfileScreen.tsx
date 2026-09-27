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
import { NilaColors } from "../../theme/colors";
import { NilaHeader } from "../../components/common/NilaHeader";
import { NilaButton } from "../../components/common/NilaButton";
import { useNila } from "../../context/NilaContext";

interface Props {
  navigation: any;
}

export const ChildProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { childrenList, selectedChild, setSelectedChild, updateChild, addChild } = useNila();

  const [activeChildId, setActiveChildId] = useState(selectedChild?.id || childrenList[0]?.id);

  const currentChild = childrenList.find((c) => c.id === activeChildId) || selectedChild;

  const interests = [
    "Dinosaur rescue",
    "Steam trains",
    "Undersea reefs",
    "Star charts",
  ];

  const themesToAvoid = ["Storms / Thunder", "Loud monsters", "Witches"];

  const handleSelectChild = (child: any) => {
    setActiveChildId(child.id);
    setSelectedChild(child);
  };

  const handleAddChild = () => {
    Alert.prompt
      ? Alert.prompt("Add Child", "Enter your child's name:", (name) => {
          if (name) {
            addChild({ name, age: 3 });
          }
        })
      : Alert.alert("Add Child", "Added 'Little Explorer' to your family profile.", [
          {
            text: "OK",
            onPress: () => addChild({ name: "Little Explorer", age: 3 }),
          },
        ]);
  };

  const handleSaveChanges = () => {
    Alert.alert("Saved", `${currentChild?.name}'s bedtime profile updated.`);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <NilaHeader title="Child Profile" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Child Switcher Tabs */}
        <View style={styles.childTabsRow}>
          {childrenList.map((ch) => {
            const isSelected = ch.id === currentChild?.id;
            return (
              <TouchableOpacity
                key={ch.id}
                style={[styles.childTab, isSelected && styles.childTabActive]}
                onPress={() => handleSelectChild(ch)}
                activeOpacity={0.8}
              >
                <Text style={[styles.childTabText, isSelected && styles.childTabTextActive]}>
                  {ch.name} ({ch.age}y)
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Child Hero Card */}
        <View style={styles.childCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>👦🏽</Text>
          </View>
          <View style={styles.childInfo}>
            <Text style={styles.childName}>{currentChild?.name || "Aarav"}</Text>
            <Text style={styles.childMeta}>
              Age: {currentChild?.age || 5} • English, Tamil
            </Text>
          </View>
        </View>

        {/* Interests & Passions */}
        <Text style={styles.sectionHeader}>INTERESTS & PASSIONS</Text>
        <View style={styles.pillsRow}>
          {interests.map((tag) => (
            <View key={tag} style={styles.pill}>
              <Text style={styles.pillText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Personality Profile */}
        <Text style={styles.sectionHeader}>PERSONALITY PROFILE</Text>
        <View style={styles.personalityCard}>
          <Text style={styles.personalityText}>
            Highly imaginative, slight fear of complete dark. Prefers reassurance and soft background
            music towards the end of the narrative.
          </Text>
        </View>

        {/* Themes to Avoid */}
        <Text style={styles.sectionHeader}>THEMES TO AVOID</Text>
        <View style={styles.pillsRow}>
          {themesToAvoid.map((avoid) => (
            <View key={avoid} style={[styles.pill, styles.avoidPill]}>
              <Text style={[styles.pillText, styles.avoidPillText]}>{avoid}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <NilaButton
          title="Save Changes"
          onPress={handleSaveChanges}
          style={styles.saveBtn}
        />
        <NilaButton
          title="Add Another Child"
          variant="secondary"
          onPress={handleAddChild}
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
  childTabsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  childTab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: NilaColors.surface,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
  },
  childTabActive: {
    backgroundColor: NilaColors.gold,
    borderColor: NilaColors.gold,
  },
  childTabText: {
    color: NilaColors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  childTabTextActive: {
    color: NilaColors.textDark,
    fontWeight: "700",
  },
  childCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: NilaColors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    marginBottom: 24,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: NilaColors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarEmoji: {
    fontSize: 26,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    color: NilaColors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  childMeta: {
    color: NilaColors.textMuted,
    fontSize: 13,
  },
  sectionHeader: {
    color: NilaColors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  pill: {
    backgroundColor: NilaColors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
  },
  pillText: {
    color: NilaColors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  avoidPill: {
    borderColor: NilaColors.coralMuted,
  },
  avoidPillText: {
    color: NilaColors.coral,
  },
  personalityCard: {
    backgroundColor: NilaColors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    marginBottom: 24,
  },
  personalityText: {
    color: NilaColors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: NilaColors.cardBorderSubtle,
  },
  saveBtn: {
    marginBottom: 10,
  },
});
