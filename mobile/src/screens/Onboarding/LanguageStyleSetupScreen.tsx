import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NilaColors } from "../../theme/colors";
import { OnboardingHeader } from "../../components/common/OnboardingHeader";
import { NilaPill } from "../../components/common/NilaPill";
import { NilaButton } from "../../components/common/NilaButton";
import { useNila } from "../../context/NilaContext";
import { ParentApi } from "../../services/api/ParentApi";
import {
  SUPPORTED_LANGUAGES,
  DIALECTS_BY_LANGUAGE,
} from "../../config/localization";

interface Props {
  route?: any;
  navigation: any;
}

export const LanguageStyleSetupScreen: React.FC<Props> = ({ route, navigation }) => {
  const { parent, setParent } = useNila();
  const isFromSettings = Boolean(route?.params?.isFromSettings);

  const [selectedLanguage, setSelectedLanguage] = useState(parent.language || "Tamil");
  const availableDialects = DIALECTS_BY_LANGUAGE[selectedLanguage] || [
    "Standard / Neutral",
  ];
  const [selectedDialect, setSelectedDialect] = useState(
    availableDialects.includes(parent.dialect || "") ? parent.dialect : availableDialects[0]
  );
  const [speakingPattern, setSpeakingPattern] = useState(
    "Native language + English"
  );
  const [loading, setLoading] = useState(false);

  const speakingPatterns = [
    { label: "Mostly native language", desc: "Pure mother tongue narration" },
    { label: "Native language + English", desc: "Natural everyday mixed conversation" },
    { label: "Mostly English", desc: "English with warm family words" },
  ];

  const handleLanguageChange = (langName: string) => {
    setSelectedLanguage(langName);
    const newDialects = DIALECTS_BY_LANGUAGE[langName] || ["Standard / Neutral"];
    setSelectedDialect(newDialects[0]);
  };

  const handleContinue = async () => {
    setLoading(true);

    const langCodeMap: Record<string, string> = {
      Tamil: "ta",
      English: "en",
      Hindi: "hi",
      Telugu: "te",
      Kannada: "kn",
      Malayalam: "ml",
    };
    const langCode = langCodeMap[selectedLanguage] || "ta";

    // 1. Update Context state
    setParent((prev) => ({
      ...prev,
      language: selectedLanguage,
      languageCode: langCode,
      dialect: selectedDialect,
      script: "Mixed",
    }));

    // 2. Persist to DynamoDB via ParentApi
    try {
      await ParentApi.updateProfile({
        preferredLanguage: selectedLanguage,
        preferredDialect: selectedDialect,
      });
    } catch (e: any) {
      console.warn("[LanguageStyleSetup] Backend profile update note:", e.message);
    } finally {
      setLoading(false);
      if (isFromSettings) {
        navigation.goBack();
      } else {
        navigation.navigate("VoiceIntro");
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {isFromSettings ? (
        <View style={styles.settingsHeaderBox}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color={NilaColors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.settingsHeaderTitle}>Language & Dialect</Text>
            <Text style={styles.settingsHeaderSub}>
              Update your family's bedtime storytelling language.
            </Text>
          </View>
        </View>
      ) : (
        <OnboardingHeader
          step={3}
          totalSteps={4}
          title="How do you talk at home?"
          subtitle="Nila uses your native vocabulary and cadence so bedtime stories sound like family, not a robot."
          onBack={() => navigation.goBack()}
        />
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Primary Language */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={NilaColors.gold} />
            <Text style={styles.cardTitle}>Primary Story Language</Text>
          </View>
          <Text style={styles.sectionSubtext}>
            Choose the language your child loves hearing bedtime stories in:
          </Text>

          <View style={styles.languagesGrid}>
            {SUPPORTED_LANGUAGES.map((item) => {
              const isSelected = selectedLanguage === item.name;
              return (
                <TouchableOpacity
                  key={item.code}
                  style={[
                    styles.langCard,
                    isSelected && styles.langCardSelected,
                  ]}
                  onPress={() => handleLanguageChange(item.name)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.langFlag}>{item.flag}</Text>
                  <Text
                    style={[
                      styles.langName,
                      isSelected && styles.langNameSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.langNative,
                      isSelected && styles.langNativeSelected,
                    ]}
                  >
                    {item.nativeName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 2: Adaptive Dialect / Slang */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="location-outline" size={18} color={NilaColors.gold} />
            <Text style={styles.cardTitle}>{selectedLanguage} Dialect / Style</Text>
          </View>
          <Text style={styles.sectionSubtext}>
            Personalized pronunciation and regional slang:
          </Text>

          <View style={styles.pillsRow}>
            {availableDialects.map((d) => (
              <NilaPill
                key={d}
                label={d}
                selected={selectedDialect === d}
                onPress={() => setSelectedDialect(d)}
              />
            ))}
          </View>
        </View>

        {/* Section 3: Speaking Pattern */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="options-outline" size={18} color={NilaColors.gold} />
            <Text style={styles.cardTitle}>Everyday Speaking Pattern</Text>
          </View>

          <View style={styles.patternList}>
            {speakingPatterns.map((pat) => {
              const isSelected = speakingPattern === pat.label;
              return (
                <TouchableOpacity
                  key={pat.label}
                  style={[
                    styles.patternItem,
                    isSelected && styles.patternItemSelected,
                  ]}
                  onPress={() => setSpeakingPattern(pat.label)}
                  activeOpacity={0.7}
                >
                  <View style={styles.radioOuter}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.patternContent}>
                    <Text
                      style={[
                        styles.patternTitle,
                        isSelected && styles.patternTitleSelected,
                      ]}
                    >
                      {pat.label}
                    </Text>
                    <Text style={styles.patternDesc}>{pat.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <NilaButton
          title={loading ? "Saving Preferences..." : isFromSettings ? "Save Changes" : "Continue to Voice Setup"}
          onPress={handleContinue}
          disabled={loading}
          style={styles.continueButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NilaColors.midnight,
  },
  settingsHeaderBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsHeaderTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: NilaColors.textPrimary,
    marginBottom: 2,
  },
  settingsHeaderSub: {
    fontSize: 12,
    color: NilaColors.textMuted,
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
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: NilaColors.textPrimary,
  },
  sectionSubtext: {
    fontSize: 13,
    color: NilaColors.textMuted,
    marginBottom: 14,
    lineHeight: 18,
  },
  languagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  langCard: {
    width: "31%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  langCardSelected: {
    backgroundColor: "rgba(245, 199, 106, 0.15)",
    borderColor: NilaColors.gold,
  },
  langFlag: {
    fontSize: 22,
    marginBottom: 4,
  },
  langName: {
    fontSize: 13,
    fontWeight: "700",
    color: NilaColors.textPrimary,
    marginBottom: 2,
  },
  langNameSelected: {
    color: NilaColors.gold,
  },
  langNative: {
    fontSize: 11,
    color: NilaColors.textMuted,
  },
  langNativeSelected: {
    color: NilaColors.gold,
    opacity: 0.9,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  patternList: {
    gap: 10,
  },
  patternItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  patternItemSelected: {
    backgroundColor: "rgba(245, 199, 106, 0.1)",
    borderColor: NilaColors.gold,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: NilaColors.gold,
  },
  patternContent: {
    flex: 1,
  },
  patternTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: NilaColors.textPrimary,
    marginBottom: 2,
  },
  patternTitleSelected: {
    color: NilaColors.gold,
  },
  patternDesc: {
    fontSize: 11,
    color: NilaColors.textMuted,
  },
  continueButton: {
    marginTop: 4,
    marginBottom: 20,
  },
});
