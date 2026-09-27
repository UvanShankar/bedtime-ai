import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NilaColors } from "../../theme/colors";
import { NilaHeader } from "../../components/common/NilaHeader";
import { NilaSlider } from "../../components/common/NilaSlider";
import { NilaButton } from "../../components/common/NilaButton";
import { useNila } from "../../context/NilaContext";

interface Props {
  navigation: any;
}

export const StoryStyleScreen: React.FC<Props> = ({ navigation }) => {
  const { styleProfile, updateStyleProfile, selectedChild } = useNila();

  const [calmingLevel, setCalmingLevel] = useState(styleProfile.calmingLevel || 0.25);
  const [adventureDepth, setAdventureDepth] = useState(styleProfile.adventureDepth || 0.25);
  const [fantasyMagic, setFantasyMagic] = useState(styleProfile.fantasyMagic || 0.75);
  const [pacingSpeed, setPacingSpeed] = useState(styleProfile.pacingSpeed || 0.25);
  const [vocabularyLevel, setVocabularyLevel] = useState(styleProfile.vocabularyLevel || 0.25);

  const favoriteWords = [
    `"Sweet dreams"`,
    `"Little sprout"`,
    `"Magic star"`,
    `"Grandma's kitchen"`,
  ];

  const handleApply = () => {
    updateStyleProfile({
      calmingLevel,
      adventureDepth,
      fantasyMagic,
      pacingSpeed,
      vocabularyLevel,
    });
    Alert.alert("Style Updated", "Nila will use these storytelling adjustments for tonight's stories.");
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <NilaHeader
        title="Storytelling Style"
        subtitle={`Bedtime Tone - Tweak how Nila structures ${selectedChild?.name || "Aarav"}'s magical stories.`}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Sliders Card */}
        <View style={styles.slidersCard}>
          <NilaSlider
            label="Calming & Whimsical"
            leftLabel="Calm"
            rightLabel="Exciting"
            value={calmingLevel}
            onValueChange={setCalmingLevel}
          />
          <View style={styles.sliderDivider} />

          <NilaSlider
            label="Adventure Depth"
            leftLabel="Quiet"
            rightLabel="Epic"
            value={adventureDepth}
            onValueChange={setAdventureDepth}
          />
          <View style={styles.sliderDivider} />

          <NilaSlider
            label="Fantasy & Magic"
            leftLabel="Real-world"
            rightLabel="Spellbinding"
            value={fantasyMagic}
            onValueChange={setFantasyMagic}
          />
          <View style={styles.sliderDivider} />

          <NilaSlider
            label="Pacing Speed"
            leftLabel="Adagio"
            rightLabel="Regular"
            value={pacingSpeed}
            onValueChange={setPacingSpeed}
          />
          <View style={styles.sliderDivider} />

          <NilaSlider
            label="Vocabulary Level"
            leftLabel="Simple"
            rightLabel="Educational"
            value={vocabularyLevel}
            onValueChange={setVocabularyLevel}
          />
        </View>

        {/* Frequently Included Words */}
        <Text style={styles.sectionHeader}>FREQUENTLY INCLUDED WORDS</Text>
        <View style={styles.wordsRow}>
          {favoriteWords.map((word) => (
            <View key={word} style={styles.wordPill}>
              <Text style={styles.wordText}>{word}</Text>
            </View>
          ))}
        </View>

        {/* Style Profile Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Style Profile Summary</Text>
          <Text style={styles.summaryText}>
            {styleProfile.summaryText ||
              `Stories tonight will be soft, slow-paced, set in highly imaginative magical realms, weaving in Dad's favorite phrases to guide ${selectedChild?.name || "Aarav"} gently to sleep.`}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <NilaButton title="Apply Style Settings" onPress={handleApply} />
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
  slidersCard: {
    backgroundColor: NilaColors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    marginBottom: 24,
  },
  sliderDivider: {
    height: 1,
    backgroundColor: NilaColors.cardBorderSubtle,
    marginVertical: 4,
  },
  sectionHeader: {
    color: NilaColors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  wordsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  wordPill: {
    backgroundColor: NilaColors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
  },
  wordText: {
    color: NilaColors.gold,
    fontSize: 13,
    fontWeight: "600",
  },
  summaryCard: {
    backgroundColor: NilaColors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    borderLeftWidth: 4,
    borderLeftColor: NilaColors.gold,
    marginBottom: 20,
  },
  summaryTitle: {
    color: NilaColors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  summaryText: {
    color: NilaColors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: NilaColors.cardBorderSubtle,
  },
});
