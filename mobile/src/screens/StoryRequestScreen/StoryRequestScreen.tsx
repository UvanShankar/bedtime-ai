import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
} from "react-native";
import { StoryApi } from "../../services/api/StoryApi";
import { LoadingState } from "../../components/LoadingState/LoadingState";

interface Props {
  route: any;
  navigation: any;
}

export const StoryRequestScreen: React.FC<Props> = ({ route, navigation }) => {
  const { parent, child } = route.params;

  const [topic, setTopic] = useState("A little elephant who cannot sleep");
  const [storyType, setStoryType] = useState("bedtime adventure");
  const [mood, setMood] = useState("warm and funny");
  const [durationMinutes, setDurationMinutes] = useState(5);
  const [bedtimeCalmness, setBedtimeCalmness] = useState(0.9);
  const [includeChildName, setIncludeChildName] = useState(true);
  const [realWorldFacts, setRealWorldFacts] = useState(false);
  const [educationalGoal, setEducationalGoal] = useState("");
  const [additionalInstruction, setAdditionalInstruction] = useState("Gentle lullaby atmosphere at the end");

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      Alert.alert("Missing topic", "Please specify a bedtime story topic.");
      return;
    }

    try {
      setIsGenerating(true);
      const story = await StoryApi.generateStory({
        parentId: parent.id,
        childId: child.id,
        topic: topic.trim(),
        storyType,
        mood,
        durationMinutes,
        educationalGoal: educationalGoal.trim() || null,
        bedtimeCalmness,
        includeChildName,
        realWorldFacts,
        additionalInstruction: additionalInstruction.trim() || undefined,
      });

      navigation.navigate("StoryResult", {
        story,
        parent,
        child,
      });
    } catch (err: any) {
      Alert.alert("Story Generation Failed", err.message || "Failed to generate story. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <View style={styles.loadingWrapper}>
        <LoadingState
          message={`Crafting ${child.name}'s Bedtime Story...`}
          submessage="Applying parent style, composing calm story segments, and generating audio narration."
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>✨ Request a Story</Text>
      <Text style={styles.subtitle}>
        Told in {parent.name}'s tone for {child.name}
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Story Topic / Idea</Text>
        <TextInput
          style={styles.input}
          value={topic}
          onChangeText={setTopic}
          placeholder="e.g. A little elephant who cannot sleep"
          placeholderTextColor="#64748B"
        />

        <Text style={styles.label}>Story Type</Text>
        <View style={styles.pillRow}>
          {["bedtime adventure", "fairy tale", "animal friends", "nature exploration"].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.pill, storyType === type && styles.activePill]}
              onPress={() => setStoryType(type)}
            >
              <Text style={[styles.pillText, storyType === type && styles.activePillText]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Mood & Tone</Text>
        <View style={styles.pillRow}>
          {["warm and funny", "gentle and sleepy", "cozy mystery", "soothing lullaby"].map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.pill, mood === m && styles.activePill]}
              onPress={() => setMood(m)}
            >
              <Text style={[styles.pillText, mood === m && styles.activePillText]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Duration: {durationMinutes} minutes</Text>
        <View style={styles.pillRow}>
          {[3, 5, 8, 10].map((mins) => (
            <TouchableOpacity
              key={mins}
              style={[styles.pill, durationMinutes === mins && styles.activePill]}
              onPress={() => setDurationMinutes(mins)}
            >
              <Text style={[styles.pillText, durationMinutes === mins && styles.activePillText]}>
                {mins} mins
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>
          Bedtime Calmness: {bedtimeCalmness >= 0.8 ? "High (Deep Sleep)" : "Moderate"}
        </Text>
        <View style={styles.pillRow}>
          {[
            { label: "High (Deep Sleep)", value: 0.95 },
            { label: "Medium Calm", value: 0.75 },
            { label: "Gentle Wind-down", value: 0.6 },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.pill, bedtimeCalmness === item.value && styles.activePill]}
              onPress={() => setBedtimeCalmness(item.value)}
            >
              <Text style={[styles.pillText, bedtimeCalmness === item.value && styles.activePillText]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Include {child.name}'s Name</Text>
          <Switch
            value={includeChildName}
            onValueChange={setIncludeChildName}
            thumbColor="#38BDF8"
            trackColor={{ false: "#334155", true: "#0284C7" }}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Include Real-World Facts</Text>
          <Switch
            value={realWorldFacts}
            onValueChange={setRealWorldFacts}
            thumbColor="#38BDF8"
            trackColor={{ false: "#334155", true: "#0284C7" }}
          />
        </View>

        <Text style={styles.label}>Educational Goal (Optional)</Text>
        <TextInput
          style={styles.input}
          value={educationalGoal}
          onChangeText={setEducationalGoal}
          placeholder="e.g. Kindness, sharing, brushing teeth"
          placeholderTextColor="#64748B"
        />

        <Text style={styles.label}>Additional Instructions</Text>
        <TextInput
          style={styles.input}
          value={additionalInstruction}
          onChangeText={setAdditionalInstruction}
          placeholder="e.g. Mention our dog Bruno"
          placeholderTextColor="#64748B"
        />
      </View>

      <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
        <Text style={styles.generateButtonText}>🌙 Generate Bedtime Story</Text>
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
  loadingWrapper: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#CBD5E1",
    marginBottom: 6,
    marginTop: 10,
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
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 4,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
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
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    marginTop: 6,
  },
  switchLabel: {
    color: "#E2E8F0",
    fontSize: 14,
    fontWeight: "500",
  },
  generateButton: {
    backgroundColor: "#38BDF8",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 8,
  },
  generateButtonText: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
  },
});
