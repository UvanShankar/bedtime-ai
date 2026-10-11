import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NilaColors } from "../../theme/colors";
import { NilaHeader } from "../../components/common/NilaHeader";
import { NilaToggle } from "../../components/common/NilaToggle";
import { NilaButton } from "../../components/common/NilaButton";
import { NilaPill } from "../../components/common/NilaPill";
import { useNila } from "../../context/NilaContext";
import { useToast } from "../../context/ToastContext";
import { ParentApi } from "../../services/api/ParentApi";

interface Props {
  navigation: any;
}

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { parent, setParent, settings, updateSettings, signOut, deleteAccount } = useNila();
  const { showToast } = useToast();

  const [showEditParentModal, setShowEditParentModal] = useState(false);
  const [parentName, setParentName] = useState(parent?.name || "");
  const [relationship, setRelationship] = useState(parent?.relationship || "Mother");
  const [savingParent, setSavingParent] = useState(false);

  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const relationships = [
    { label: "🌸 Mother", value: "Mother" },
    { label: "⭐ Father", value: "Father" },
    { label: "👵 Grandmother", value: "Grandmother" },
    { label: "👴 Grandfather", value: "Grandfather" },
    { label: "✨ Guardian / Other", value: "Other" },
  ];

  const handleSaveParentDetails = async () => {
    setSavingParent(true);
    const finalName = parentName.trim() || relationship;
    try {
      setParent((prev) => ({
        ...prev,
        name: finalName,
        relationship: relationship as any,
      }));
      await ParentApi.updateProfile({
        fullName: finalName,
        relationship,
      });
      setShowEditParentModal(false);
      showToast({
        type: "success",
        title: "Storyteller Updated",
        message: `Saved as ${finalName} (${relationship})`,
      });
    } catch (e: any) {
      showToast({
        type: "error",
        title: "Update Error",
        message: e.message || "Failed to update profile.",
      });
    } finally {
      setSavingParent(false);
    }
  };

  const confirmSignOut = async () => {
    setIsProcessing(true);
    try {
      await signOut();
      setShowSignOutModal(false);
      try {
        navigation.reset({
          index: 0,
          routes: [{ name: "Welcome" }],
        });
      } catch {
        navigation.navigate("Welcome");
      }
    } catch (e: any) {
      Alert.alert("Sign Out Error", e.message || "Failed to sign out.");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmDeleteAccount = async () => {
    setIsProcessing(true);
    try {
      await deleteAccount();
      setShowDeleteModal(false);
      try {
        navigation.reset({
          index: 0,
          routes: [{ name: "Welcome" }],
        });
      } catch {
        navigation.navigate("Welcome");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to wipe account data.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <NilaHeader title="Settings" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Storyteller Details */}
        <Text style={styles.sectionHeader}>STORYTELLER PROFILE</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => {
              setParentName(parent?.name || "");
              setRelationship(parent?.relationship || "Mother");
              setShowEditParentModal(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.rowLabelBox}>
              <Text style={styles.rowTitle}>Storyteller Name & Role</Text>
              <Text style={styles.rowSub}>
                {parent?.name ? `${parent.name} (${parent.relationship})` : "Tap to set name & role"}
              </Text>
            </View>
            <View style={styles.actionPill}>
              <Text style={styles.actionPillText}>Edit</Text>
              <Ionicons name="chevron-forward" size={16} color={NilaColors.gold} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Bedtime Configuration Section */}
        <Text style={styles.sectionHeader}>BEDTIME CONFIGURATION</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.rowItem}
            onPress={() =>
              showToast({
                type: "info",
                title: "Gentle Sleep Timer",
                message: "Stories automatically fade out after 30 minutes.",
              })
            }
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

        {/* Privacy & Account Management */}
        <Text style={styles.sectionHeader}>ACCOUNT & DATA MANAGEMENT</Text>
        <View style={styles.card}>
          {/* Sign Out Button */}
          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => setShowSignOutModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.rowLabelBox}>
              <Text style={styles.signOutText}>Sign Out</Text>
              <Text style={styles.rowSub}>Sign out of your account on this device</Text>
            </View>
            <Ionicons name="log-out-outline" size={20} color={NilaColors.gold} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Delete Account Button */}
          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => setShowDeleteModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.rowLabelBox}>
              <Text style={styles.deleteText}>Delete Account & Wipe Data</Text>
              <Text style={styles.rowSub}>Permanently erase all voice models, stories, and child profiles</Text>
            </View>
            <Ionicons name="trash-outline" size={20} color={NilaColors.coral} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Parent Modal */}
      <Modal
        visible={showEditParentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditParentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Storyteller Details</Text>
              <TouchableOpacity onPress={() => setShowEditParentModal(false)}>
                <Ionicons name="close" size={24} color={NilaColors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Your Name</Text>
            <TextInput
              style={styles.modalInput}
              value={parentName}
              onChangeText={setParentName}
              placeholder="e.g. Priya or David"
              placeholderTextColor={NilaColors.textMuted}
            />

            <Text style={styles.modalLabel}>Relationship</Text>
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

            <NilaButton
              title={savingParent ? "Saving..." : "Save Changes"}
              onPress={handleSaveParentDetails}
              disabled={savingParent}
              style={{ marginTop: 20 }}
            />
          </View>
        </View>
      </Modal>

      {/* Sign Out Confirmation Modal */}
      <Modal
        visible={showSignOutModal}
        transparent
        animationType="fade"
        onRequestClose={() => !isProcessing && setShowSignOutModal(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogBox}>
            <View style={[styles.dialogIconCircle, { backgroundColor: "rgba(255, 215, 0, 0.12)" }]}>
              <Ionicons name="log-out-outline" size={28} color={NilaColors.gold} />
            </View>

            <Text style={styles.dialogTitle}>Sign Out of Nila?</Text>
            <Text style={styles.dialogSubtitle}>
              Are you sure you want to sign out? You can sign back in anytime using your phone number.
            </Text>

            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setShowSignOutModal(false)}
                disabled={isProcessing}
                activeOpacity={0.7}
              >
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dialogDestructiveBtn}
                onPress={confirmSignOut}
                disabled={isProcessing}
                activeOpacity={0.7}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.dialogDestructiveText}>Sign Out</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => !isProcessing && setShowDeleteModal(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogBox}>
            <View style={[styles.dialogIconCircle, { backgroundColor: "rgba(255, 107, 107, 0.12)" }]}>
              <Ionicons name="trash-outline" size={28} color={NilaColors.coral} />
            </View>

            <Text style={styles.dialogTitle}>Delete Account & Data?</Text>
            <Text style={styles.dialogSubtitle}>
              This will permanently delete your account, saved children profiles, stories, and voice models. This cannot be undone.
            </Text>

            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setShowDeleteModal(false)}
                disabled={isProcessing}
                activeOpacity={0.7}
              >
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dialogDestructiveBtn, { backgroundColor: NilaColors.coral }]}
                onPress={confirmDeleteAccount}
                disabled={isProcessing}
                activeOpacity={0.7}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.dialogDestructiveText}>Delete Data</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginRight: 10,
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
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 199, 106, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: NilaColors.gold,
  },
  divider: {
    height: 1,
    backgroundColor: NilaColors.cardBorderSubtle,
  },
  signOutText: {
    color: NilaColors.gold,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  deleteText: {
    color: NilaColors.coral,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: NilaColors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: NilaColors.textPrimary,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: NilaColors.textPrimary,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: NilaColors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 16,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: "rgba(10, 14, 26, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  dialogBox: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: NilaColors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    padding: 24,
    alignItems: "center",
  },
  dialogIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: NilaColors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  dialogSubtitle: {
    fontSize: 14,
    color: NilaColors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  dialogActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  dialogCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  dialogCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: NilaColors.textSecondary,
  },
  dialogDestructiveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: NilaColors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  dialogDestructiveText: {
    fontSize: 15,
    fontWeight: "700",
    color: NilaColors.midnight,
  },
});
