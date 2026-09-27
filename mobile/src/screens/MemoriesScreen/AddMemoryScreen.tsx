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
import { Ionicons } from "@expo/vector-icons";
import { NilaColors } from "../../theme/colors";
import { NilaHeader } from "../../components/common/NilaHeader";
import { NilaTextInput } from "../../components/common/NilaTextInput";
import { NilaPill } from "../../components/common/NilaPill";
import { NilaToggle } from "../../components/common/NilaToggle";
import { NilaButton } from "../../components/common/NilaButton";
import { useNila } from "../../context/NilaContext";

interface Props {
  route?: any;
  navigation: any;
}

export const AddMemoryScreen: React.FC<Props> = ({ route, navigation }) => {
  const { memoryToEdit } = route?.params || {};
  const { selectedChild, addMemory, updateMemory } = useNila();

  const [description, setDescription] = useState(
    memoryToEdit?.description ||
      "We baked chocolate chip cookies together. Aarav got flour on his nose and called himself the Cookie Monster. Teddy got the first bite..."
  );
  const [title, setTitle] = useState(memoryToEdit?.title || "Baking cookies afternoon");
  const [when, setWhen] = useState(memoryToEdit?.date || "Today");
  const [who, setWho] = useState<string[]>(
    memoryToEdit?.people || [selectedChild?.name || "Aarav", "Dad", "Mom"]
  );
  const [emotions, setEmotions] = useState<string[]>(
    memoryToEdit?.emotions || ["Cozy", "Silly"]
  );
  const [useInStories, setUseInStories] = useState(
    memoryToEdit ? memoryToEdit.useInStories : true
  );

  const whenOptions = ["Today", "Yesterday", "Choose date..."];
  const whoOptions = [selectedChild?.name || "Aarav", "Mom", "Dad", "Paati", "Thatha"];
  const emotionOptions = ["Cozy", "Silly", "Happy", "Peaceful", "Emotional"];

  const toggleWho = (person: string) => {
    setWho((prev) =>
      prev.includes(person) ? prev.filter((p) => p !== person) : [...prev, person]
    );
  };

  const toggleEmotion = (emo: string) => {
    setEmotions((prev) =>
      prev.includes(emo) ? prev.filter((e) => e !== emo) : [...prev, emo]
    );
  };

  const handleSave = () => {
    if (!description.trim()) {
      Alert.alert("Memory required", "Please share a few words about what happened.");
      return;
    }

    if (memoryToEdit) {
      updateMemory({
        ...memoryToEdit,
        title: title.trim() || "Bedtime memory",
        description: description.trim(),
        date: when === "Today" ? "May 14, 2026" : when,
        people: who,
        emotions,
        useInStories,
      });
    } else {
      addMemory({
        parentId: "parent-001",
        childId: selectedChild?.id || "child-001",
        title: title.trim() || "Bedtime memory",
        description: description.trim(),
        date: when === "Today" ? "May 14, 2026" : when,
        people: who,
        emotions,
        useInStories,
      });
    }

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <NilaHeader
        title="Save a little memory"
        subtitle="Nila turns this moment into bedtime magic."
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* What Happened */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WHAT HAPPENED?</Text>
          <NilaTextInput
            placeholder="We baked chocolate chip cookies together..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* When */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WHEN?</Text>
          <View style={styles.pillsRow}>
            {whenOptions.map((opt) => (
              <NilaPill
                key={opt}
                label={opt}
                selected={when === opt}
                onPress={() => setWhen(opt)}
                variant="gold"
              />
            ))}
          </View>
        </View>

        {/* Who was there */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WHO WAS THERE?</Text>
          <View style={styles.pillsRow}>
            {whoOptions.map((person) => (
              <NilaPill
                key={person}
                label={person}
                selected={who.includes(person)}
                onPress={() => toggleWho(person)}
                variant="blue"
              />
            ))}
          </View>
        </View>

        {/* Emotion */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>EMOTION</Text>
          <View style={styles.pillsRow}>
            {emotionOptions.map((emo) => (
              <NilaPill
                key={emo}
                label={emo}
                selected={emotions.includes(emo)}
                onPress={() => toggleEmotion(emo)}
                variant="gold"
              />
            ))}
          </View>
        </View>

        {/* Photo Upload Area */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ADD A PHOTO (OPTIONAL)</Text>
          <TouchableOpacity
            style={styles.photoUploadBox}
            onPress={() => Alert.alert("Upload Photo", "Photo added from camera roll.")}
            activeOpacity={0.8}
          >
            <Ionicons name="image-outline" size={28} color={NilaColors.textMuted} />
            <Text style={styles.photoUploadText}>Tap to upload a sweet snap</Text>
          </TouchableOpacity>
        </View>

        {/* Include in Next Stories Toggle */}
        <View style={styles.section}>
          <View style={styles.toggleCard}>
            <NilaToggle
              label="Include in next stories"
              sublabel="Nila prioritizes this memory tonight"
              value={useInStories}
              onValueChange={setUseInStories}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <NilaButton title="Save Memory to Nila" onPress={handleSave} />
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
    color: NilaColors.gold,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  photoUploadBox: {
    backgroundColor: NilaColors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: NilaColors.cardBorder,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  photoUploadText: {
    color: NilaColors.textMuted,
    fontSize: 13,
  },
  toggleCard: {
    backgroundColor: NilaColors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: NilaColors.cardBorderSubtle,
  },
});
