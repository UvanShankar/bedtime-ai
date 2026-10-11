import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NilaColors } from "../../theme/colors";
import { OnboardingHeader } from "../../components/common/OnboardingHeader";
import { NilaTextInput } from "../../components/common/NilaTextInput";
import { NilaPill } from "../../components/common/NilaPill";
import { NilaButton } from "../../components/common/NilaButton";
import { useNila } from "../../context/NilaContext";
import { ParentApi } from "../../services/api/ParentApi";

interface Props {
  navigation: any;
}

export const ParentProfileSetupScreen: React.FC<Props> = ({ navigation }) => {
  const { parent, setParent, addChild } = useNila();

  // Parent State (clean defaults, no hardcoded "Uvan")
  const [parentName, setParentName] = useState(
    parent.name && parent.name !== "Uvan" && parent.name !== "Parent" ? parent.name : ""
  );
  const [relationship, setRelationship] = useState(parent.relationship || "Mother");
  const [childNickname, setChildNickname] = useState(
    parent.preferredChildName && parent.preferredChildName !== "Kanna" ? parent.preferredChildName : ""
  );

  // Child State (clean defaults)
  const [childName, setChildName] = useState("");
  const [age, setAge] = useState(4);
  const [interests, setInterests] = useState<string[]>(["Animals", "Stories"]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const relationships = [
    { label: "🌸 Mother", value: "Mother" },
    { label: "⭐ Father", value: "Father" },
    { label: "👵 Grandmother", value: "Grandmother" },
    { label: "👴 Grandfather", value: "Grandfather" },
    { label: "✨ Guardian / Other", value: "Other" },
  ];

  const nicknameSuggestions = ["Sweetheart", "Champ", "Buddy", "Cutie", "Little One"];

  const interestOptions = [
    { label: "Animals", emoji: "🦁" },
    { label: "Space", emoji: "🚀" },
    { label: "Trains", emoji: "🚂" },
    { label: "Magic", emoji: "✨" },
    { label: "Dinosaurs", emoji: "🦖" },
    { label: "Nature", emoji: "🌲" },
    { label: "Drawing", emoji: "🎨" },
    { label: "Sports", emoji: "⚽" },
  ];

  const toggleInterest = (item: string) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleContinue = async () => {
    setErrorMessage("");
    const finalParentName = parentName.trim() || relationship;
    const finalChildName = childName.trim() || childNickname.trim() || "Sweetheart";

    setLoading(true);
    try {
      // 1. Update Parent Profile in Context & Backend
      setParent((prev) => ({
        ...prev,
        name: finalParentName,
        relationship: relationship as any,
        preferredChildName: childNickname.trim() || "Sweetheart",
      }));

      await ParentApi.updateProfile({
        fullName: finalParentName,
        relationship,
      }).catch((err) => console.warn("[FamilySetup] Parent update note:", err.message));

      // 2. Create Child Profile in Context & Backend
      addChild({
        name: finalChildName,
        age,
        interests,
        personality: ["Curious", "Playful"],
        avoidTopics: ["Monsters"],
        favoriteCharacters: [],
      });

      // 3. Move forward to Step 3 (Language & Style)
      navigation.navigate("LanguageStyleSetup");
    } catch (err: any) {
      console.warn("[FamilySetup] Save error:", err.message);
      navigation.navigate("LanguageStyleSetup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <OnboardingHeader
        step={2}
        totalSteps={4}
        title="Who's listening tonight?"
        subtitle="Nila personalizes every bedtime story with familiar family warmth."
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {errorMessage ? (
            <View style={styles.errorBadge}>
              <Ionicons name="alert-circle" size={18} color="#FF6B6B" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Card 1: Storyteller (Parent) */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-outline" size={18} color={NilaColors.gold} />
              <Text style={styles.cardTitle}>You (The Storyteller)</Text>
            </View>

            <NilaTextInput
              label="Your Name"
              placeholder="e.g. Priya or David"
              value={parentName}
              onChangeText={setParentName}
            />

            <Text style={styles.fieldLabel}>I am...</Text>
            <View style={styles.pillsRow}>
              {relationships.map((rel) => (
                <NilaPill
                  key={rel.value}
                  label={rel.label}
                  selected={relationship === rel.value}
                  onPress={() => setRelationship(rel.value)}
                />
              ))}
            </View>
          </View>

          {/* Card 2: Child Profile */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="sparkles-outline" size={18} color={NilaColors.gold} />
              <Text style={styles.cardTitle}>Your Child</Text>
            </View>

            <NilaTextInput
              label="Child's Name"
              placeholder="e.g. Aarav, Ananya"
              value={childName}
              onChangeText={setChildName}
            />

            <View style={{ marginBottom: 16 }}>
              <NilaTextInput
                label="What do you call your child at home?"
                placeholder="e.g. Kanna, sweetheart, champ"
                value={childNickname}
                onChangeText={setChildNickname}
                containerStyle={{ marginBottom: 8 }}
              />
              <Text style={styles.subtext}>Quick suggestions:</Text>
              <View style={styles.chipsRow}>
                {nicknameSuggestions.map((nick) => (
                  <TouchableOpacity
                    key={nick}
                    style={[
                      styles.quickChip,
                      childNickname === nick && styles.quickChipActive,
                    ]}
                    onPress={() => setChildNickname(nick)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.quickChipText,
                        childNickname === nick && styles.quickChipTextActive,
                      ]}
                    >
                      {nick}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Age Stepper */}
            <View style={styles.stepperRow}>
              <Text style={styles.fieldLabel}>Age</Text>
              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => setAge((prev) => Math.max(1, prev - 1))}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={18} color={NilaColors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.stepperValue}>
                  {age} <Text style={styles.stepperUnit}>years old</Text>
                </Text>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => setAge((prev) => Math.min(12, prev + 1))}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={18} color={NilaColors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Favorite Interests */}
            <Text style={styles.fieldLabel}>Things they love (Pick 2 or more)</Text>
            <View style={styles.interestsGrid}>
              {interestOptions.map((opt) => {
                const selected = interests.includes(opt.label);
                return (
                  <TouchableOpacity
                    key={opt.label}
                    style={[
                      styles.interestChip,
                      selected && styles.interestChipSelected,
                    ]}
                    onPress={() => toggleInterest(opt.label)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.interestEmoji}>{opt.emoji}</Text>
                    <Text
                      style={[
                        styles.interestText,
                        selected && styles.interestTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <NilaButton
            title={loading ? "Saving..." : "Continue to Language & Style"}
            onPress={handleContinue}
            disabled={loading}
            style={styles.continueButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NilaColors.midnight,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: NilaColors.textPrimary,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: NilaColors.textPrimary,
    marginBottom: 10,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  subtext: {
    fontSize: 12,
    color: NilaColors.textMuted,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  quickChipActive: {
    backgroundColor: "rgba(245, 199, 106, 0.15)",
    borderColor: NilaColors.gold,
  },
  quickChipText: {
    fontSize: 12,
    color: NilaColors.textMuted,
  },
  quickChipTextActive: {
    color: NilaColors.gold,
    fontWeight: "700",
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    fontSize: 14,
    fontWeight: "700",
    color: NilaColors.textPrimary,
    paddingHorizontal: 12,
  },
  stepperUnit: {
    fontSize: 12,
    fontWeight: "400",
    color: NilaColors.textMuted,
  },
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    gap: 6,
  },
  interestChipSelected: {
    backgroundColor: "rgba(245, 199, 106, 0.15)",
    borderColor: NilaColors.gold,
  },
  interestEmoji: {
    fontSize: 15,
  },
  interestText: {
    fontSize: 13,
    color: NilaColors.textMuted,
  },
  interestTextSelected: {
    color: NilaColors.gold,
    fontWeight: "700",
  },
  continueButton: {
    marginTop: 8,
    marginBottom: 20,
  },
  errorBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 107, 0.12)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 13,
  },
});
