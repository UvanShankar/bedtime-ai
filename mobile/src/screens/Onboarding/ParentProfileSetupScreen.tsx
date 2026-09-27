import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NilaColors } from "../../theme/colors";
import { NilaHeader } from "../../components/common/NilaHeader";
import { NilaTextInput } from "../../components/common/NilaTextInput";
import { NilaPill } from "../../components/common/NilaPill";
import { NilaButton } from "../../components/common/NilaButton";
import { useNila } from "../../context/NilaContext";

interface Props {
  navigation: any;
}

export const ParentProfileSetupScreen: React.FC<Props> = ({ navigation }) => {
  const { parent, setParent } = useNila();

  const [parentName, setParentName] = useState(parent.name || "David");
  const [relationship, setRelationship] = useState(parent.relationship || "father");
  const [childNickname, setChildNickname] = useState(parent.preferredChildName || "Kanna");

  const relationships = [
    { label: "Mother", value: "mother" },
    { label: "Father", value: "father" },
    { label: "Grandparent", value: "grandparent" },
    { label: "Guardian", value: "guardian" },
    { label: "Other", value: "other" },
  ];

  const nicknameSuggestions = ["Kanna", "Kutty", "Chellam", "Rasa", "Champ"];

  const handleContinue = () => {
    setParent((prev) => ({
      ...prev,
      name: parentName,
      relationship: relationship as any,
      preferredChildName: childNickname,
    }));
    navigation.navigate("ChildProfileSetup");
  };

  return (
    <SafeAreaView style={styles.container}>
      <NilaHeader
        title="Let's get to know you"
        subtitle="Nila uses this to make stories sound natural and personal."
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <NilaTextInput
          label="Parent's Name"
          placeholder="e.g. David"
          value={parentName}
          onChangeText={setParentName}
        />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Relationship to child</Text>
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

        <View style={styles.section}>
          <NilaTextInput
            label="What do you usually call your child?"
            placeholder="e.g. sweetheart, champ, my little explorer"
            value={childNickname}
            onChangeText={setChildNickname}
          />
          <Text style={styles.subtext}>Or tap an example to use:</Text>
          <View style={styles.pillsRow}>
            {nicknameSuggestions.map((nick) => (
              <NilaPill
                key={nick}
                label={nick}
                selected={childNickname === nick}
                onPress={() => setChildNickname(nick)}
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
    marginBottom: 20,
  },
  sectionLabel: {
    color: NilaColors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  subtext: {
    color: NilaColors.textMuted,
    fontSize: 13,
    marginBottom: 8,
    marginTop: -4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: NilaColors.cardBorderSubtle,
  },
});
