import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NilaColors } from "../../theme/colors";
import { NilaHeader } from "../../components/common/NilaHeader";
import { NilaButton } from "../../components/common/NilaButton";
import { NilaTextInput } from "../../components/common/NilaTextInput";
import { useNila } from "../../context/NilaContext";
import { useToast } from "../../context/ToastContext";

interface Props {
  navigation: any;
}

export const ChildProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { childrenList, selectedChild, setSelectedChild, updateChild, addChild, deleteChild } = useNila();
  const { showToast } = useToast();

  const [activeChildId, setActiveChildId] = useState(selectedChild?.id || childrenList[0]?.id);
  const currentChild = childrenList.find((c) => c.id === activeChildId) || selectedChild;

  // Editable child details
  const [childName, setChildName] = useState(currentChild?.name || "");
  const [childAge, setChildAge] = useState(currentChild?.age || 4);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    currentChild?.interests || ["Animals", "Stories"]
  );

  // Add child modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [newChildAge, setNewChildAge] = useState(3);

  // Sync state when switching children
  useEffect(() => {
    if (currentChild) {
      setChildName(currentChild.name || "");
      setChildAge(currentChild.age || 4);
      setSelectedInterests(currentChild.interests || ["Animals", "Stories"]);
    }
  }, [activeChildId, currentChild]);

  const interestOptions = [
    { label: "Animals", emoji: "🦁" },
    { label: "Space", emoji: "🚀" },
    { label: "Trains", emoji: "🚂" },
    { label: "Magic", emoji: "✨" },
    { label: "Dinosaurs", emoji: "🦖" },
    { label: "Nature", emoji: "🌲" },
    { label: "Drawing", emoji: "🎨" },
    { label: "Sports", emoji: "⚽" },
  ];

  const toggleInterest = (tag: string) => {
    setSelectedInterests((prev) =>
      prev.includes(tag) ? prev.filter((i) => i !== tag) : [...prev, tag]
    );
  };

  const handleSelectChild = (child: any) => {
    setActiveChildId(child.id);
    setSelectedChild(child);
  };

  const handleSaveChildChanges = () => {
    if (!currentChild) return;
    const finalName = childName.trim() || currentChild.name || "Little One";

    updateChild({
      ...currentChild,
      name: finalName,
      age: childAge,
      interests: selectedInterests,
    });

    showToast({
      type: "success",
      title: "Child Profile Updated",
      message: `${finalName}'s preferences have been saved.`,
    });
    navigation.goBack();
  };

  const handleConfirmAddChild = () => {
    const finalName = newChildName.trim() || "Little Explorer";
    addChild({
      name: finalName,
      age: newChildAge,
      interests: ["Animals", "Stories"],
    });
    setNewChildName("");
    setNewChildAge(3);
    setShowAddModal(false);
    showToast({
      type: "success",
      title: "New Child Added",
      message: `${finalName} added to family profiles.`,
    });
  };

  const handleDeleteChild = () => {
    if (!currentChild) return;
    Alert.alert(
      `Delete ${currentChild.name}'s Profile?`,
      `Are you sure you want to remove ${currentChild.name}? This child's profile and settings will be permanently removed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Profile",
          style: "destructive",
          onPress: async () => {
            try {
              const childNameToRemove = currentChild.name;
              if (deleteChild) {
                await deleteChild(currentChild.id);
                showToast({
                  type: "info",
                  title: "Profile Removed",
                  message: `${childNameToRemove}'s profile was removed.`,
                });
              }
            } catch (err: any) {
              showToast({
                type: "error",
                title: "Error",
                message: err.message || "Failed to delete child profile",
              });
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <NilaHeader title="Child Profile" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Child Switcher Tabs */}
        {childrenList.length > 0 && (
          <View style={styles.childTabsRow}>
            {childrenList.map((ch) => {
              const isSelected = ch.id === currentChild?.id;
              return (
                <TouchableOpacity
                  key={ch.id}
                  style={[styles.childTab, isSelected && styles.childTabActive]}
                  onPress={() => handleSelectChild(ch)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.childTabText, isSelected && styles.childTabTextActive]}>
                    {ch.name} ({ch.age}y)
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Edit Child Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Child Details</Text>

          <NilaTextInput
            label="Child's Name"
            placeholder="e.g. Aarav or Ananya"
            value={childName}
            onChangeText={setChildName}
          />

          {/* Age Stepper */}
          <View style={styles.stepperRow}>
            <Text style={styles.fieldLabel}>Age</Text>
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => setChildAge((prev) => Math.max(1, prev - 1))}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={18} color={NilaColors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>
                {childAge} <Text style={styles.stepperUnit}>years old</Text>
              </Text>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => setChildAge((prev) => Math.min(12, prev + 1))}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={18} color={NilaColors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Interests & Passions */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Favorite Story Themes</Text>
          <Text style={styles.subtext}>
            Nila will weave these topics into tonight's adventures:
          </Text>

          <View style={styles.interestsGrid}>
            {interestOptions.map((opt) => {
              const selected = selectedInterests.includes(opt.label);
              return (
                <TouchableOpacity
                  key={opt.label}
                  style={[
                    styles.interestChip,
                    selected && styles.interestChipSelected,
                  ]}
                  onPress={() => toggleInterest(opt.label)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.interestEmoji}>{opt.emoji}</Text>
                  <Text
                    style={[
                      styles.interestText,
                      selected && styles.interestTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Buttons */}
        <NilaButton
          title="Save Changes"
          onPress={handleSaveChildChanges}
          style={styles.saveBtn}
        />
        <NilaButton
          title="+ Add Another Child"
          variant="secondary"
          onPress={() => setShowAddModal(true)}
        />

        {childrenList.length > 1 && (
          <TouchableOpacity
            style={styles.deleteChildBtn}
            onPress={handleDeleteChild}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={16} color={NilaColors.coral} />
            <Text style={styles.deleteChildBtnText}>
              Delete {currentChild?.name || "Child"}'s Profile
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Add Child Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Another Child</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={NilaColors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Child's Name</Text>
            <TextInput
              style={styles.modalInput}
              value={newChildName}
              onChangeText={setNewChildName}
              placeholder="e.g. Diya or Leo"
              placeholderTextColor={NilaColors.textMuted}
            />

            <View style={styles.stepperRow}>
              <Text style={styles.modalLabel}>Age</Text>
              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => setNewChildAge((prev) => Math.max(1, prev - 1))}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={18} color={NilaColors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.stepperValue}>
                  {newChildAge} <Text style={styles.stepperUnit}>years old</Text>
                </Text>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => setNewChildAge((prev) => Math.min(12, prev + 1))}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={18} color={NilaColors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            <NilaButton
              title="Add Child"
              onPress={handleConfirmAddChild}
              style={{ marginTop: 20 }}
            />
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
  childTabsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
    flexWrap: "wrap",
  },
  childTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: NilaColors.surface,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
  },
  childTabActive: {
    backgroundColor: NilaColors.gold,
    borderColor: NilaColors.gold,
  },
  childTabText: {
    color: NilaColors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  childTabTextActive: {
    color: NilaColors.textDark,
    fontWeight: "700",
  },
  card: {
    backgroundColor: NilaColors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    marginBottom: 20,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: NilaColors.textPrimary,
    marginBottom: 14,
  },
  subtext: {
    fontSize: 12,
    color: NilaColors.textMuted,
    marginBottom: 14,
    lineHeight: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: NilaColors.textPrimary,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    fontSize: 14,
    fontWeight: "700",
    color: NilaColors.textPrimary,
    paddingHorizontal: 12,
  },
  stepperUnit: {
    fontSize: 12,
    fontWeight: "400",
    color: NilaColors.textMuted,
  },
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    gap: 6,
  },
  interestChipSelected: {
    backgroundColor: "rgba(245, 199, 106, 0.15)",
    borderColor: NilaColors.gold,
  },
  interestEmoji: {
    fontSize: 15,
  },
  interestText: {
    fontSize: 13,
    color: NilaColors.textMuted,
  },
  interestTextSelected: {
    color: NilaColors.gold,
    fontWeight: "700",
  },
  saveBtn: {
    marginBottom: 12,
    marginTop: 8,
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
  deleteChildBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 18,
    paddingVertical: 12,
  },
  deleteChildBtnText: {
    color: NilaColors.coral,
    fontSize: 14,
    fontWeight: "600",
  },
});
