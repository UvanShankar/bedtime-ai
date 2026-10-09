import React, { useState } from "react";
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
import { NilaHeader } from "../../components/common/NilaHeader";
import { NilaTextInput } from "../../components/common/NilaTextInput";
import { NilaPill } from "../../components/common/NilaPill";
import { NilaSlider } from "../../components/common/NilaSlider";
import { NilaToggle } from "../../components/common/NilaToggle";
import { NilaButton } from "../../components/common/NilaButton";
import { useNila } from "../../context/NilaContext";

interface Props {
  route?: any;
  navigation: any;
}

export const StoryRequestScreen: React.FC<Props> = ({ route, navigation }) => {
  const { parent, selectedChild, memories, voiceProfile } = useNila();
  const { suggestedTopic, suggestedType } = route?.params || {};

  const [topic, setTopic] = useState(
    suggestedTopic || "A little elephant who wants to count the stars"
  );
  const [storyType, setStoryType] = useState(suggestedType || "Bedtime Adventure");
  const [mood, setMood] = useState("Gentle & Sleepy");
  const [duration, setDuration] = useState("5 min");
  const [calmness, setCalmness] = useState(0.75); // Playful <-> Sleepy

  // Personalization toggles
  const [includeChildName, setIncludeChildName] = useState(true);
  const [includeFavoriteThings, setIncludeFavoriteThings] = useState(true);
  const [includeFamilyMembers, setIncludeFamilyMembers] = useState(false);
  const [includeLifeMemories, setIncludeLifeMemories] = useState(true);

  const surpriseTopics = [
    "A little elephant who wants to count the stars",
    "A sleepy blue train that travels through misty clouds",
    "A tiny glowing firefly searching for the sweetest mango",
    "A little dinosaur looking for his soft bedtime blanket",
    "A magical paper boat sailing along a peaceful silver river",
  ];

  const storyTypes = [
    "Bedtime Adventure",
    "Fairy Tale",
    "Animal Friends",
    "Nature",
    "Family",
    "Funny",
    "Magical",
    "Learning",
  ];

  const moods = [
    "Warm & Funny",
    "Gentle & Sleepy",
    "Cozy",
    "Magical",
    "Peaceful",
    "Playful",
  ];

  const durations = ["3 min", "5 min", "8 min", "10 min"];

  const handleSurpriseMe = () => {
    const randomTopic = surpriseTopics[Math.floor(Math.random() * surpriseTopics.length)];
    setTopic(randomTopic);
  };

  const handleCreate = () => {
    const durationNum = parseInt(duration) || 5;
    const requestPayload = {
      parentId: parent?.id || "parent-001",
      childId: selectedChild?.id || "child-001",
      topic,
      storyType,
      mood,
      durationMinutes: durationNum,
      bedtimeCalmness: calmness,
      includeChildName,
      includeFavoriteThings,
      includeFamilyMembers,
      includeLifeMemories,
      selectedMemoryIds: includeLifeMemories ? memories.slice(0, 2).map((m) => m.id) : [],
      voiceProfileId: voiceProfile?.id || undefined,
      voiceProvider: voiceProfile?.provider || undefined,
    };

    navigation.navigate("StoryCreation", { request: requestPayload });
  };

  return (
    <SafeAreaView style={styles.container}>
      <NilaHeader
        title="What should tonight's story be?"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Story Topic */}
        <View style={styles.section}>
          <View style={styles.topicHeaderRow}>
            <Text style={styles.sectionLabel}>Story Topic</Text>
            <TouchableOpacity
              style={styles.surpriseButton}
              onPress={handleSurpriseMe}
              activeOpacity={0.7}
            >
              <Text style={styles.surpriseText}>✨ Surprise me</Text>
            </TouchableOpacity>
          </View>
          <NilaTextInput
            placeholder="A little elephant who wants to count the stars"
            value={topic}
            onChangeText={setTopic}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Story Type */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Story Type</Text>
          <View style={styles.pillsRow}>
            {storyTypes.map((type) => (
              <NilaPill
                key={type}
                label={type}
                selected={storyType === type}
                onPress={() => setStoryType(type)}
              />
            ))}
          </View>
        </View>

        {/* Bedtime Mood */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Bedtime Mood</Text>
          <View style={styles.pillsRow}>
            {moods.map((m) => (
              <NilaPill
                key={m}
                label={m}
                selected={mood === m}
                onPress={() => setMood(m)}
                variant="gold"
              />
            ))}
          </View>
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Duration</Text>
          <View style={styles.pillsRow}>
            {durations.map((dur) => (
              <NilaPill
                key={dur}
                label={dur}
                selected={duration === dur}
                onPress={() => setDuration(dur)}
              />
            ))}
          </View>
        </View>

        {/* Bedtime Calmness Slider */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Bedtime Calmness</Text>
          <NilaSlider
            leftLabel="Playful"
            rightLabel="Very Sleepy"
            value={calmness}
            onValueChange={setCalmness}
          />
        </View>

        {/* Make It Theirs */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Make it theirs</Text>
          <View style={styles.togglesCard}>
            <NilaToggle
              label={`Include child's name (${selectedChild?.name || "Aarav"})`}
              value={includeChildName}
              onValueChange={setIncludeChildName}
            />
            <View style={styles.toggleDivider} />

            <NilaToggle
              label="Include favorite things (Trains)"
              value={includeFavoriteThings}
              onValueChange={setIncludeFavoriteThings}
            />
            <View style={styles.toggleDivider} />

            <NilaToggle
              label="Include family members"
              value={includeFamilyMembers}
              onValueChange={setIncludeFamilyMembers}
            />
            <View style={styles.toggleDivider} />

            <NilaToggle
              label="Include life memories (Marina Beach)"
              value={includeLifeMemories}
              onValueChange={setIncludeLifeMemories}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <NilaButton title="Create Story" onPress={handleCreate} />
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
  topicHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionLabel: {
    color: NilaColors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  surpriseButton: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  surpriseText: {
    color: NilaColors.gold,
    fontSize: 13,
    fontWeight: "600",
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  togglesCard: {
    backgroundColor: NilaColors.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
  },
  toggleDivider: {
    height: 1,
    backgroundColor: NilaColors.cardBorderSubtle,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: NilaColors.cardBorderSubtle,
  },
});
