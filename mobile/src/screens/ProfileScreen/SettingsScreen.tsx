import React from "react";
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
import { NilaToggle } from "../../components/common/NilaToggle";
import { useNila } from "../../context/NilaContext";

interface Props {
  navigation: any;
}

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { parent, settings, updateSettings } = useNila();

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Nila Account?",
      "This will permanently remove all family profiles, cloned voices, and saved bedtime stories.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => {
            navigation.navigate("Welcome");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <NilaHeader title="Settings" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <Text style={styles.sectionHeader}>ACCOUNT & ACCOUNT ACCESS</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => Alert.alert("Account Details", `Signed in as ${parent?.name || "Uvan"} (Guardian)`)}
            activeOpacity={0.7}
          >
            <View style={styles.rowLabelBox}>
              <Text style={styles.rowTitle}>{parent?.name || "Uvan"}'s Account Details</Text>
              <Text style={styles.rowSub}>Guardian Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={NilaColors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => Alert.alert("Family Sharing", "Invite spouse or grandparents to narrate stories.")}
            activeOpacity={0.7}
          >
            <View style={styles.rowLabelBox}>
              <Text style={styles.rowTitle}>Manage Shared Members</Text>
              <Text style={styles.rowSub}>Invite Family</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={NilaColors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Bedtime Configuration Section */}
        <Text style={styles.sectionHeader}>BEDTIME CONFIGURATION</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => Alert.alert("Sleep Timer", "Set to 30 mins (Gradual Fade)")}
            activeOpacity={0.7}
          >
            <View style={styles.rowLabelBox}>
              <Text style={styles.rowTitle}>Gentle Sleep Timer</Text>
              <Text style={styles.rowSub}>30 mins (Gradual Fade)</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={NilaColors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <NilaToggle
            label="Auto-play Next Story"
            value={settings.autoPlayNext}
            onValueChange={(val) => updateSettings({ autoPlayNext: val })}
          />

          <View style={styles.divider} />

          <NilaToggle
            label="High Fidelity Audio quality"
            value={settings.highFidelityAudio}
            onValueChange={(val) => updateSettings({ highFidelityAudio: val })}
          />
        </View>

        {/* Privacy & Data Policy Section */}
        <Text style={styles.sectionHeader}>PRIVACY & DATA POLICY</Text>
        <View style={styles.card}>
          <NilaToggle
            label="Anonymize voice generation"
            value={settings.anonymizeVoice}
            onValueChange={(val) => updateSettings({ anonymizeVoice: val })}
          />

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => Alert.alert("Retention", "Bedtime stories retained for Last 30 Days.")}
            activeOpacity={0.7}
          >
            <View style={styles.rowLabelBox}>
              <Text style={styles.rowTitle}>Story History Retention</Text>
              <Text style={styles.rowSub}>Last 30 Days</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={NilaColors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.rowItem}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteText}>Delete Nila Account</Text>
            <Ionicons name="chevron-forward" size={18} color={NilaColors.coral} />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingBottom: 40,
  },
  sectionHeader: {
    color: NilaColors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: NilaColors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    marginBottom: 24,
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  rowLabelBox: {
    flex: 1,
  },
  rowTitle: {
    color: NilaColors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  rowSub: {
    color: NilaColors.textMuted,
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: NilaColors.cardBorderSubtle,
  },
  deleteText: {
    color: NilaColors.coral,
    fontSize: 15,
    fontWeight: "600",
  },
});
