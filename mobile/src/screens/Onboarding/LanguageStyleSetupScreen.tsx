import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NilaColors } from "../../theme/colors";
import { NilaHeader } from "../../components/common/NilaHeader";
import { NilaPill } from "../../components/common/NilaPill";
import { NilaButton } from "../../components/common/NilaButton";
import { useNila } from "../../context/NilaContext";

interface Props {
  navigation: any;
}

export const LanguageStyleSetupScreen: React.FC<Props> = ({ navigation }) => {
  const { parent, setParent } = useNila();

  const [language, setLanguage] = useState(parent.language || "Tamil");
  const [speakingPattern, setSpeakingPattern] = useState("Native language + English");
  const [dialect, setDialect] = useState(parent.dialect || "Chennai");
  const [script, setScript] = useState(parent.script || "Mixed");

  const languages = [
    "Tamil",
    "Telugu",
    "Kannada",
    "Malayalam",
    "Hindi",
    "English",
    "Marathi",
    "Bengali",
    "Other",
  ];

  const speakingPatterns = [
    "Mostly my native language",
    "Native language + English",
    "Mostly English",
    "Mixed languages",
  ];

  const tamilDialects = [
    "Chennai",
    "Madurai",
    "Kongu",
    "Tirunelveli",
    "Jaffna",
    "Other",
    "Not sure",
  ];

  const scripts = ["Native script", "Romanized", "Mixed"];

  const handleContinue = () => {
    setParent((prev) => ({
      ...prev,
      language,
      languageCode: language === "Tamil" ? "ta" : "en",
      dialect,
      script,
    }));
    navigation.navigate("VoiceIntro");
  };

  return (
    <SafeAreaView style={styles.container}>
      <NilaHeader
        title="How do you talk at home?"
        subtitle="Nila should sound like your family, not a textbook."
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Language */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Primary home language</Text>
          <View style={styles.pillsRow}>
            {languages.map((lang) => (
              <NilaPill
                key={lang}
                label={lang}
                selected={language === lang}
                onPress={() => setLanguage(lang)}
              />
            ))}
          </View>
        </View>

        {/* Speaking Pattern */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Speaking pattern</Text>
          <View style={styles.pillsRow}>
            {speakingPatterns.map((pat) => (
              <NilaPill
                key={pat}
                label={pat}
                selected={speakingPattern === pat}
                onPress={() => setSpeakingPattern(pat)}
              />
            ))}
          </View>
        </View>

        {/* Dialect */}
        {language === "Tamil" && (
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.sectionLabel}>Tamil Dialect / Region</Text>
              <Text style={styles.badgeLabel}>Active selection</Text>
            </View>
            <View style={styles.pillsRow}>
              {tamilDialects.map((dia) => (
                <NilaPill
                  key={dia}
                  label={dia}
                  selected={dialect === dia}
                  onPress={() => setDialect(dia)}
                  variant="gold"
                />
              ))}
            </View>
          </View>
        )}

        {/* Script */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Preferred script for reading story text</Text>
          <View style={styles.pillsRow}>
            {scripts.map((sc) => (
              <NilaPill
                key={sc}
                label={sc}
                selected={script === sc}
                onPress={() => setScript(sc)}
                variant="gold"
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
    marginBottom: 22,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionLabel: {
    color: NilaColors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  badgeLabel: {
    color: NilaColors.gold,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
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
