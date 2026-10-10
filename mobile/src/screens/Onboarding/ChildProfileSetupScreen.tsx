import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NilaColors } from "../../theme/colors";
import { NilaHeader } from "../../components/common/NilaHeader";
import { NilaTextInput } from "../../components/common/NilaTextInput";
import { NilaPill } from "../../components/common/NilaPill";
import { NilaButton } from "../../components/common/NilaButton";
import { useNila } from "../../context/NilaContext";

interface Props {
  navigation: any;
}

export const ChildProfileSetupScreen: React.FC<Props> = ({ navigation }) => {
  const { selectedChild, addChild } = useNila();

  const hasUserCustomChild = Boolean(selectedChild?.name && selectedChild.name !== "Aarav");

  const [childName, setChildName] = useState(hasUserCustomChild ? selectedChild.name : "");
  const [age, setAge] = useState(selectedChild?.age || 4);
  const [interests, setInterests] = useState<string[]>(
    hasUserCustomChild ? selectedChild?.interests || [] : []
  );
  const [personalities, setPersonalities] = useState<string[]>(
    hasUserCustomChild ? selectedChild?.personality || [] : ["Curious", "Playful"]
  );
  const [favoriteCharacters, setFavoriteCharacters] = useState(
    hasUserCustomChild ? selectedChild?.favoriteCharacters?.join(", ") || "" : ""
  );
  const [avoidances, setAvoidances] = useState<string[]>(
    hasUserCustomChild ? selectedChild?.avoidTopics || [] : []
  );

  const interestOptions = [
    { label: "Trains", emoji: "🚂" },
    { label: "Dinosaurs", emoji: "🦖" },
    { label: "Animals", emoji: "🦁" },
    { label: "Space", emoji: "🚀" },
    { label: "Nature", emoji: "🌲" },
    { label: "Drawing", emoji: "🎨" },
    { label: "Sports", emoji: "⚽" },
    { label: "Toys", emoji: "🧸" },
    { label: "Stories", emoji: "📖" },
    { label: "Magic", emoji: "✨" },
  ];

  const personalityOptions = [
    "Curious",
    "Playful",
    "Gentle",
    "Imaginative",
    "Adventurous",
    "Shy",
    "Funny",
    "Energetic",
    "Dreamy",
  ];

  const avoidanceOptions = [
    "Monsters",
    "Darkness",
    "Loud noises",
    "Getting lost",
    "Fighting",
    "Sad endings",
    "Separation",
  ];

  const toggleInterest = (item: string) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const togglePersonality = (item: string) => {
    setPersonalities((prev) =>
      prev.includes(item) ? prev.filter((p) => p !== item) : [...prev, item]
    );
  };

  const toggleAvoidance = (item: string) => {
    setAvoidances((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleContinue = () => {
    const finalChildName = childName.trim() || "Kanna";
    addChild({
      name: finalChildName,
      age,
      interests,
      personality: personalities,
      avoidTopics: avoidances,
      favoriteCharacters: favoriteCharacters
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    navigation.navigate("LanguageStyleSetup");
  };

  return (
    <SafeAreaView style={styles.container}>
      <NilaHeader
        title="Tell us about your little one"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <NilaTextInput
          label="Child's Name"
          placeholder="e.g. Aarav, Ananya, Kanna"
          value={childName}
          onChangeText={setChildName}
        />

        {/* Age Stepper */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Age</Text>
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setAge((prev) => Math.max(1, prev - 1))}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={20} color={NilaColors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.stepperValue}>
              {age} <Text style={styles.stepperUnit}>years old</Text>
            </Text>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setAge((prev) => Math.min(12, prev + 1))}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={20} color={NilaColors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Interests */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>What do they love?</Text>
          <View style={styles.pillsRow}>
            {interestOptions.map((opt) => (
              <NilaPill
                key={opt.label}
                label={opt.label}
                emoji={opt.emoji}
                selected={interests.includes(opt.label)}
                onPress={() => toggleInterest(opt.label)}
              />
            ))}
          </View>
        </View>

        {/* Personality */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Personality</Text>
          <View style={styles.pillsRow}>
            {personalityOptions.map((pers) => (
              <NilaPill
                key={pers}
                label={pers}
                selected={personalities.includes(pers)}
                onPress={() => togglePersonality(pers)}
                variant="blue"
              />
            ))}
          </View>
        </View>

        <NilaTextInput
          label="Favorite characters or animals"
          placeholder="e.g. Leo the friendly lion, blue trains"
          value={favoriteCharacters}
          onChangeText={setFavoriteCharacters}
        />

        {/* Things to Avoid */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Things to avoid at bedtime</Text>
          <View style={styles.pillsRow}>
            {avoidanceOptions.map((avoid) => (
              <NilaPill
                key={avoid}
                label={avoid}
                selected={avoidances.includes(avoid)}
                onPress={() => toggleAvoidance(avoid)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <NilaButton title="Continue" onPress={handleContinue} />
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
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    color: NilaColors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: NilaColors.surface,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: NilaColors.cardBorder,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: "space-between",
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: NilaColors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    color: NilaColors.textPrimary,
    fontSize: 17,
    fontWeight: "700",
  },
  stepperUnit: {
    color: NilaColors.textSecondary,
    fontSize: 14,
    fontWeight: "400",
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: NilaColors.cardBorderSubtle,
  },
});
