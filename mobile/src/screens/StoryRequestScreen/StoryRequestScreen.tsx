import React, { useState, useEffect } from "react";
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
import { NilaTextInput } from "../../components/common/NilaTextInput";
import { NilaPill } from "../../components/common/NilaPill";
import { NilaSlider } from "../../components/common/NilaSlider";
import { NilaToggle } from "../../components/common/NilaToggle";
import { NilaButton } from "../../components/common/NilaButton";
import { useNila } from "../../context/NilaContext";
import { useAudioPlayer } from "../../hooks/useAudioPlayer";
import { logger } from "../../utils/logger";

interface Props {
  route?: any;
  navigation: any;
}

export const StoryRequestScreen: React.FC<Props> = ({ route, navigation }) => {
  const { parent, selectedChild, memories, voiceProfile, voiceProfiles, refreshVoicesFromBackend } = useNila();
  const { suggestedTopic, suggestedType } = route?.params || {};

  const [topic, setTopic] = useState(
    suggestedTopic || "A little elephant who wants to count the stars"
  );
  const [storyType, setStoryType] = useState(suggestedType || "Bedtime Adventure");
  const [mood, setMood] = useState("Gentle & Sleepy");
  const [duration, setDuration] = useState("5 min");
  const [calmness, setCalmness] = useState(0.75); // Playful <-> Sleepy

  // Voice Selection Options
  const defaultPresets = [
    {
      id: "voc_preset_priya",
      name: "Amma / Priya (அம்மா)",
      speaker: "priya",
      provider: "sarvam",
      isCloned: false,
      tag: "Warm & Gentle",
      description: "Loving motherly Tamil narration",
      avatar: "👩",
      previewUrl: "https://nila-story-audio-prod-354953409985.s3.ap-south-1.amazonaws.com/stories/sty_6b0a378d8ee9_1791582797989.mp3",
    },
    {
      id: "voc_preset_karun",
      name: "Appa / Karun (அப்பா)",
      speaker: "karun",
      provider: "sarvam",
      isCloned: false,
      tag: "Cozy Bedtime",
      description: "Deep, gentle fatherly storytelling",
      avatar: "👨",
      previewUrl: "https://nila-story-audio-prod-354953409985.s3.ap-south-1.amazonaws.com/stories/sty_0031d1d3f756_1791578804598.mp3",
    },
    {
      id: "voc_preset_kavitha",
      name: "Paati / Kavitha (பாட்டி)",
      speaker: "kavitha",
      provider: "sarvam",
      isCloned: false,
      tag: "Storyteller",
      description: "Traditional grandmother story cadence",
      avatar: "👵",
      previewUrl: "https://nila-story-audio-prod-354953409985.s3.ap-south-1.amazonaws.com/stories/sty_6b0a378d8ee9_1791582797989.mp3",
    },
  ];

  // Map all real custom profiles created by the parent
  const allClonedList = (voiceProfiles && voiceProfiles.length > 0)
    ? voiceProfiles
    : (voiceProfile && voiceProfile.id && voiceProfile.id !== "voc_default_priya" ? [voiceProfile] : []);

  const clonedVoiceOptions = allClonedList
    .filter((v) => v && v.id && v.id !== "voc_default_priya" && v.status !== "failed")
    .map((v) => {
      const providerLower = (v.provider || "sarvam").toLowerCase();
      const providerBadge = providerLower === "elevenlabs" ? "🌐 ElevenLabs" : "⚡ Sarvam AI";
      const providerLabel = providerLower === "elevenlabs" ? "ElevenLabs" : "Sarvam AI";
      return {
        id: v.id,
        name:
          v.displayName ||
          `${parent?.relationship === "Amma" || parent?.relationship === "mother" ? "Amma" : parent?.relationship === "Appa" || parent?.relationship === "father" ? "Appa" : parent?.name || "Parent"}'s Voice`,
        speaker: v.providerVoiceId || v.id,
        provider: providerLower,
        isCloned: true,
        tag: `✨ ${providerBadge}`,
        description: `Your custom voice clone (${providerLabel})`,
        avatar: "🎙️",
        previewUrl:
          v.previewAudioUrl ||
          (v.sourceAudioKey && (v.sourceAudioKey.startsWith("file") || v.sourceAudioKey.startsWith("http"))
            ? v.sourceAudioKey
            : ""),
      };
    });

  const voiceOptions = [...clonedVoiceOptions, ...defaultPresets];

  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(
    clonedVoiceOptions.length > 0 ? clonedVoiceOptions[0].id : "voc_preset_priya"
  );

  useEffect(() => {
    refreshVoicesFromBackend().catch(() => {});
  }, []);

  useEffect(() => {
    if (clonedVoiceOptions.length > 0 && (selectedVoiceId === "voc_preset_priya" || !voiceOptions.some((v) => v.id === selectedVoiceId))) {
      setSelectedVoiceId(clonedVoiceOptions[0].id);
    }
  }, [clonedVoiceOptions.length]);

  const { state: previewAudioState, controller: previewController } = useAudioPlayer();
  const [playingPreviewVoiceId, setPlayingPreviewVoiceId] = useState<string | null>(null);

  const handleToggleVoicePreview = async (voice: (typeof voiceOptions)[0], e: any) => {
    e?.stopPropagation?.();
    try {
      if (playingPreviewVoiceId === voice.id && previewAudioState.isPlaying) {
        await previewController.pause();
        setPlayingPreviewVoiceId(null);
      } else {
        if (voice.previewUrl) {
          setPlayingPreviewVoiceId(voice.id);
          await previewController.load(voice.previewUrl);
          await previewController.play();
        } else {
          Alert.alert("Preview Unavailable", "No audio preview is available for this voice sample.");
        }
      }
    } catch (err: any) {
      logger.warn("VOICE", `Preview voice error: ${err.message}`);
    }
  };

  // Personalization toggles
  const [includeChildName, setIncludeChildName] = useState(true);
  const [includeFavoriteThings, setIncludeFavoriteThings] = useState(false);
  const [includeFamilyMembers, setIncludeFamilyMembers] = useState(false);
  const [includeLifeMemories, setIncludeLifeMemories] = useState(false);
  const [selectedMemoryIds, setSelectedMemoryIds] = useState<string[]>([]);

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
    logger.info("STORY", `[StoryRequestScreen] Surprise me selected topic: "${randomTopic}"`);
    setTopic(randomTopic);
  };

  const handleToggleMemorySelection = (memoryId: string) => {
    setSelectedMemoryIds((prev) =>
      prev.includes(memoryId) ? prev.filter((id) => id !== memoryId) : [...prev, memoryId]
    );
  };

  const handleCreate = () => {
    const durationNum = parseInt(duration) || 5;
    const chosenVoice = voiceOptions.find((v) => v.id === selectedVoiceId) || voiceOptions[0];
    previewController.stop().catch(() => {});

    const canIncludeMemories = Boolean(
      includeLifeMemories && memories && memories.length > 0 && selectedMemoryIds.length > 0
    );
    const resolvedSelectedMemoryIds = canIncludeMemories ? selectedMemoryIds : [];

    const requestPayload = {
      parentId: parent?.id || "parent-001",
      childId: selectedChild?.id || "child-001",
      relationship: parent?.relationship || "Appa",
      topic,
      storyType,
      mood,
      durationMinutes: durationNum,
      bedtimeCalmness: calmness,
      includeChildName,
      includeFavoriteThings: Boolean(includeFavoriteThings && selectedChild?.interests?.length),
      includeFamilyMembers,
      includeLifeMemories: canIncludeMemories,
      selectedMemoryIds: resolvedSelectedMemoryIds,
      voiceProfileId: chosenVoice.isCloned ? chosenVoice.id : undefined,
      voiceProvider: chosenVoice.provider,
      speaker: chosenVoice.speaker,
      voiceName: chosenVoice.name,
    };

    logger.info("STORY", `[StoryRequestScreen] Selected Voice: "${chosenVoice.name}" | Provider: "${chosenVoice.provider}" | Speaker: "${chosenVoice.speaker || 'none'}" | isCloned: ${chosenVoice.isCloned}`);
    logger.info("STORY", `[StoryRequestScreen] Navigating to StoryCreation with configuration`, {
      child: selectedChild?.name,
      topic,
      storyType,
      duration: `${durationNum} min`,
      calmness,
      voice: chosenVoice.name,
      voiceProvider: chosenVoice.provider,
      speaker: chosenVoice.speaker,
    });

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
              <Text style={styles.surpriseText}>âœ¨ Surprise me</Text>
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

        {/* Narrator Voice Selection */}
        <View style={styles.section}>
          <View style={styles.topicHeaderRow}>
            <Text style={styles.sectionLabel}>Narrator Voice (குரல் தேர்வு)</Text>
            <TouchableOpacity
              style={styles.surpriseButton}
              onPress={() => {
                previewController.stop().catch(() => {});
                navigation.navigate("VoiceRecording");
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.surpriseText}>+ Record Voice</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.voiceCardsList}>
            {voiceOptions.map((voice) => {
              const isSelected = voice.id === selectedVoiceId;
              const isPlayingThis = playingPreviewVoiceId === voice.id && previewAudioState.isPlaying;

              return (
                <TouchableOpacity
                  key={voice.id}
                  style={[
                    styles.voiceCard,
                    isSelected && styles.voiceCardSelected,
                    voice.isCloned && styles.voiceCardCloned,
                  ]}
                  onPress={() => setSelectedVoiceId(voice.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.voiceCardLeft}>
                    <View style={[styles.voiceAvatarCircle, isSelected && styles.voiceAvatarCircleSelected]}>
                      <Text style={styles.voiceAvatarText}>{voice.avatar}</Text>
                    </View>
                    <View style={styles.voiceInfo}>
                      <View style={styles.voiceTitleRow}>
                        <Text style={[styles.voiceName, isSelected && styles.voiceNameSelected]}>
                          {voice.name}
                        </Text>
                        <View style={[styles.voiceTagBadge, isSelected && styles.voiceTagBadgeSelected]}>
                          <Text style={[styles.voiceTagText, isSelected && styles.voiceTagTextSelected]}>
                            {voice.tag}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.voiceDescription}>{voice.description}</Text>
                    </View>
                  </View>

                  <View style={styles.voiceCardRight}>
                    {voice.previewUrl ? (
                      <TouchableOpacity
                        style={[styles.previewMiniButton, isPlayingThis && styles.previewMiniButtonActive]}
                        onPress={(e) => handleToggleVoicePreview(voice, e)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name={isPlayingThis ? "pause" : "volume-medium"}
                          size={16}
                          color={isPlayingThis ? NilaColors.midnight : NilaColors.gold}
                        />
                      </TouchableOpacity>
                    ) : null}

                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected ? <View style={styles.radioInner} /> : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Make It Theirs */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Make it theirs</Text>
          <View style={styles.togglesCard}>
            <NilaToggle
              label={`Include child's name (${selectedChild?.name || "Child"})`}
              value={includeChildName}
              onValueChange={setIncludeChildName}
            />
            <View style={styles.toggleDivider} />

            <NilaToggle
              label={
                selectedChild?.interests && selectedChild.interests.length > 0
                  ? `Include favorite things (${selectedChild.interests[0]})`
                  : "Include favorite things"
              }
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
              label="Include life memories"
              sublabel={
                memories && memories.length > 0
                  ? selectedMemoryIds.length > 0
                    ? `${selectedMemoryIds.length} memory selected to weave tonight`
                    : "Tap below to select which memories to weave"
                  : "No memories added yet"
              }
              value={Boolean(memories && memories.length > 0 && includeLifeMemories)}
              onValueChange={(val) => {
                if (memories && memories.length > 0) {
                  setIncludeLifeMemories(val);
                  if (val && selectedMemoryIds.length === 0) {
                    setSelectedMemoryIds([memories[0].id]);
                  }
                } else {
                  setIncludeLifeMemories(false);
                }
              }}
              disabled={!memories || memories.length === 0}
            />

            {/* When life memories is enabled, show the selectable memory list */}
            {includeLifeMemories && memories && memories.length > 0 ? (
              <View style={styles.memoryPickerSection}>
                <View style={styles.memoryPickerHeader}>
                  <Text style={styles.memoryPickerSubtitle}>Select memories to weave:</Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("AddMemory")}
                    style={styles.addMemoryInlineBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.addMemoryInlineText}>+ Add New</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.memoryCardsList}>
                  {memories.map((mem) => {
                    const isSelected = selectedMemoryIds.includes(mem.id);
                    return (
                      <TouchableOpacity
                        key={mem.id}
                        style={[
                          styles.memoryCardItem,
                          isSelected && styles.memoryCardItemSelected,
                        ]}
                        onPress={() => handleToggleMemorySelection(mem.id)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.memoryCardItemLeft}>
                          <View
                            style={[
                              styles.memoryCheckbox,
                              isSelected && styles.memoryCheckboxSelected,
                            ]}
                          >
                            {isSelected ? (
                              <Ionicons name="checkmark" size={12} color={NilaColors.midnight} />
                            ) : null}
                          </View>
                          <View style={styles.memoryItemInfo}>
                            <View style={styles.memoryItemTitleRow}>
                              <Text
                                style={[
                                  styles.memoryItemTitle,
                                  isSelected && styles.memoryItemTitleSelected,
                                ]}
                                numberOfLines={1}
                              >
                                {mem.title}
                              </Text>
                              {mem.date ? (
                                <Text style={styles.memoryItemDate}>{mem.date}</Text>
                              ) : null}
                            </View>
                            <Text
                              style={styles.memoryItemSnippet}
                              numberOfLines={2}
                            >
                              {mem.description}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {(!memories || memories.length === 0) ? (
              <TouchableOpacity
                style={styles.emptyMemoryBanner}
                onPress={() => navigation.navigate("AddMemory")}
                activeOpacity={0.7}
              >
                <Ionicons name="sparkles" size={14} color={NilaColors.gold} />
                <Text style={styles.emptyMemoryBannerText}>
                  + Add a real family memory to weave tonight
                </Text>
              </TouchableOpacity>
            ) : null}
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
  voiceCardsList: {
    gap: 10,
  },
  voiceCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: NilaColors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: NilaColors.cardBorder,
  },
  voiceCardSelected: {
    borderColor: NilaColors.gold,
    backgroundColor: "rgba(245, 199, 106, 0.08)",
  },
  voiceCardCloned: {
    borderLeftWidth: 4,
    borderLeftColor: NilaColors.gold,
  },
  voiceCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  voiceAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  voiceAvatarCircleSelected: {
    backgroundColor: "rgba(245, 199, 106, 0.2)",
  },
  voiceAvatarText: {
    fontSize: 20,
  },
  voiceInfo: {
    flex: 1,
  },
  voiceTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 2,
  },
  voiceName: {
    color: NilaColors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  voiceNameSelected: {
    color: NilaColors.gold,
  },
  voiceTagBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  voiceTagBadgeSelected: {
    backgroundColor: "rgba(245, 199, 106, 0.2)",
  },
  voiceTagText: {
    color: NilaColors.textSecondary,
    fontSize: 10,
    fontWeight: "600",
  },
  voiceTagTextSelected: {
    color: NilaColors.gold,
  },
  voiceDescription: {
    color: NilaColors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  voiceCardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  previewMiniButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(245, 199, 106, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewMiniButtonActive: {
    backgroundColor: NilaColors.gold,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: NilaColors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: {
    borderColor: NilaColors.gold,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: NilaColors.gold,
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
  memoryPickerSection: {
    marginTop: 10,
    marginBottom: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: NilaColors.cardBorderSubtle,
  },
  memoryPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  memoryPickerSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: NilaColors.textMuted,
    letterSpacing: 0.5,
  },
  addMemoryInlineBtn: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  addMemoryInlineText: {
    fontSize: 12,
    fontWeight: "700",
    color: NilaColors.gold,
  },
  memoryCardsList: {
    gap: 8,
  },
  memoryCardItem: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: NilaColors.cardBorderSubtle,
  },
  memoryCardItemSelected: {
    borderColor: NilaColors.gold,
    backgroundColor: "rgba(245, 199, 106, 0.08)",
  },
  memoryCardItemLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  memoryCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: NilaColors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 1,
  },
  memoryCheckboxSelected: {
    backgroundColor: NilaColors.gold,
    borderColor: NilaColors.gold,
  },
  memoryItemInfo: {
    flex: 1,
  },
  memoryItemTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  memoryItemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: NilaColors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  memoryItemTitleSelected: {
    color: NilaColors.gold,
  },
  memoryItemDate: {
    fontSize: 11,
    color: NilaColors.textMuted,
  },
  memoryItemSnippet: {
    fontSize: 12,
    color: NilaColors.textSecondary,
    lineHeight: 17,
  },
  emptyMemoryBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: "rgba(245, 199, 106, 0.08)",
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(245, 199, 106, 0.3)",
  },
  emptyMemoryBannerText: {
    fontSize: 13,
    fontWeight: "600",
    color: NilaColors.gold,
  },
});
