import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { ParentApi } from "../../services/api/ParentApi";

interface Props {
  navigation: any;
}

export const ParentChildScreen: React.FC<Props> = ({ navigation }) => {
  // Parent state
  const [parentName, setParentName] = useState("Lakshmi");
  const [relationship, setRelationship] = useState<"mother" | "father" | "grandparent" | "guardian" | "other">("mother");
  const [language, setLanguage] = useState("Tamil");
  const [languageCode, setLanguageCode] = useState("ta-IN");
  const [dialect, setDialect] = useState("Madurai");
  const [script, setScript] = useState("Tamil");

  // Child state
  const [childName, setChildName] = useState("Aarav");
  const [age, setAge] = useState("4");
  const [interests, setInterests] = useState("trains, little stars, friendly animals");
  const [personality, setPersonality] = useState("curious, imaginative, gentle");
  const [avoidTopics, setAvoidTopics] = useState("monsters, dark caves, loud noises");
  const [favoriteCharacters, setFavoriteCharacters] = useState("Sleepy Little Elephant");

  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!parentName.trim() || !childName.trim() || !language.trim() || !languageCode.trim()) {
      Alert.alert("Missing details", "Please enter parent name, child name, and language.");
      return;
    }

    try {
      setLoading(true);
      // 1. Create Parent
      const parent = await ParentApi.createParent({
        name: parentName.trim(),
        relationship,
        language: language.trim(),
        languageCode: languageCode.trim(),
        dialect: dialect.trim() || undefined,
        script: script.trim() || undefined,
      });

      // 2. Create Child
      const child = await ParentApi.createChild({
        parentId: parent.id,
        name: childName.trim(),
        age: parseInt(age, 10) || 4,
        interests: interests.split(",").map((s) => s.trim()).filter(Boolean),
        personality: personality.split(",").map((s) => s.trim()).filter(Boolean),
        avoidTopics: avoidTopics.split(",").map((s) => s.trim()).filter(Boolean),
        favoriteCharacters: favoriteCharacters.split(",").map((s) => s.trim()).filter(Boolean),
      });

      // 3. Navigate to Voice Setup
      navigation.navigate("VoiceSetup", {
        parent,
        child,
      });
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save profile. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>🌙 Bedtime AI Profile</Text>
      <Text style={styles.subtitle}>Personalize stories with your voice and child's world</Text>

      {/* PARENT SECTION */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>👤 Parent Details</Text>

        <Text style={styles.label}>Your Name</Text>
        <TextInput
          style={styles.input}
          value={parentName}
          onChangeText={setParentName}
          placeholder="e.g. Lakshmi"
          placeholderTextColor="#64748B"
        />

        <Text style={styles.label}>Relationship</Text>
        <View style={styles.pillRow}>
          {(["mother", "father", "grandparent", "guardian", "other"] as const).map((rel) => (
            <TouchableOpacity
              key={rel}
              style={[styles.pill, relationship === rel && styles.activePill]}
              onPress={() => setRelationship(rel)}
            >
              <Text style={[styles.pillText, relationship === rel && styles.activePillText]}>
                {rel.charAt(0).toUpperCase() + rel.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>Language</Text>
            <TextInput
              style={styles.input}
              value={language}
              onChangeText={setLanguage}
              placeholder="e.g. Tamil, English"
              placeholderTextColor="#64748B"
            />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.label}>Code (e.g. ta-IN)</Text>
            <TextInput
              style={styles.input}
              value={languageCode}
              onChangeText={setLanguageCode}
              placeholder="e.g. ta-IN, en-US"
              placeholderTextColor="#64748B"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>Dialect / Region</Text>
            <TextInput
              style={styles.input}
              value={dialect}
              onChangeText={setDialect}
              placeholder="e.g. Madurai, Southern"
              placeholderTextColor="#64748B"
            />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.label}>Preferred Script</Text>
            <TextInput
              style={styles.input}
              value={script}
              onChangeText={setScript}
              placeholder="e.g. Latin, Tamil"
              placeholderTextColor="#64748B"
            />
          </View>
        </View>
      </View>

      {/* CHILD SECTION */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>🧒 Child Details</Text>

        <View style={styles.row}>
          <View style={{ flex: 2 }}>
            <Text style={styles.label}>Child's Name</Text>
            <TextInput
              style={styles.input}
              value={childName}
              onChangeText={setChildName}
              placeholder="e.g. Aarav"
              placeholderTextColor="#64748B"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              placeholder="4"
              placeholderTextColor="#64748B"
            />
          </View>
        </View>

        <Text style={styles.label}>Interests (comma separated)</Text>
        <TextInput
          style={styles.input}
          value={interests}
          onChangeText={setInterests}
          placeholder="e.g. trains, dinosaurs, stars"
          placeholderTextColor="#64748B"
        />

        <Text style={styles.label}>Personality Traits</Text>
        <TextInput
          style={styles.input}
          value={personality}
          onChangeText={setPersonality}
          placeholder="e.g. curious, giggly, sweet"
          placeholderTextColor="#64748B"
        />

        <Text style={styles.label}>Things to Avoid at Bedtime</Text>
        <TextInput
          style={styles.input}
          value={avoidTopics}
          onChangeText={setAvoidTopics}
          placeholder="e.g. monsters, darkness, loud adventures"
          placeholderTextColor="#64748B"
        />

        <Text style={styles.label}>Favorite Characters / Animals</Text>
        <TextInput
          style={styles.input}
          value={favoriteCharacters}
          onChangeText={setFavoriteCharacters}
          placeholder="e.g. Sleepy Elephant, Moon Bunny"
          placeholderTextColor="#64748B"
        />
      </View>

      <TouchableOpacity
        style={[styles.continueButton, loading && styles.disabledButton]}
        onPress={handleContinue}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#0F172A" />
        ) : (
          <Text style={styles.continueButtonText}>Continue to Voice Setup →</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#F8FAFC",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#94A3B8",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#38BDF8",
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#CBD5E1",
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: "#0F172A",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#334155",
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 4,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#334155",
  },
  activePill: {
    backgroundColor: "#38BDF8",
    borderColor: "#38BDF8",
  },
  pillText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },
  activePillText: {
    color: "#0F172A",
  },
  continueButton: {
    backgroundColor: "#38BDF8",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
  },
});
