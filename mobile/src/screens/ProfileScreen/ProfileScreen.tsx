import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NilaColors } from "../../theme/colors";
import { useNila } from "../../context/NilaContext";
import { useToast } from "../../context/ToastContext";

interface Props {
  navigation: any;
}

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { parent, selectedChild, voiceProfile, signOut } = useNila();
  const { showToast } = useToast();
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const confirmSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      setShowSignOutModal(false);
      try {
        navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
      } catch {
        navigation.navigate("Welcome");
      }
    } catch (e) {
      console.warn("Sign out error", e);
    } finally {
      setIsSigningOut(false);
    }
  };

  const menuItems = [
    {
      id: "child",
      title: `${selectedChild?.name || "Aarav"}'s Profile`,
      icon: "person-outline",
      onPress: () => navigation.navigate("ChildProfile"),
    },
    {
      id: "voice",
      title: voiceProfile?.displayName ? `Voice Profile (${voiceProfile.displayName})` : "Voice Profiles",
      icon: "mic-outline",
      onPress: () => navigation.navigate("VoiceProfile"),
    },
    {
      id: "language",
      title: `Story Language (${parent?.language || "Tamil"})`,
      icon: "language-outline",
      onPress: () => navigation.navigate("LanguageSettings"),
    },
    {
      id: "style",
      title: "Storyteller Style & Words",
      icon: "color-wand-outline",
      onPress: () => navigation.navigate("StoryStyle"),
    },
    {
      id: "memories",
      title: "Memory Vault",
      icon: "file-tray-full-outline",
      onPress: () => navigation.navigate("MainTabs", { screen: "Memories" }),
    },
    {
      id: "settings",
      title: "App Settings & Sleep Timer",
      icon: "options-outline",
      onPress: () => navigation.navigate("Settings"),
    },
    {
      id: "sharing",
      title: "Family Sharing & Invite",
      icon: "people-outline",
      onPress: () =>
        showToast({
          type: "info",
          title: "Family Sharing",
          message: "Invite spouse or grandparents to narrate bedtime stories.",
        }),
    },
    {
      id: "notifications",
      title: "Bedtime Notifications",
      icon: "notifications-outline",
      onPress: () =>
        showToast({
          type: "info",
          title: "Bedtime Reminder",
          message: "Bedtime gentle chime is set for 8:30 PM daily.",
        }),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Nila</Text>
        <Text style={styles.headerSubtitle}>
          Control your family's personalized storyteller settings.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Guardian Card */}
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarEmoji}>👨🏽</Text>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {parent?.name ? `${parent.name} (${parent.relationship || "Guardian"})` : parent?.relationship || "Guardian"}
            </Text>
            <Text style={styles.userRole}>
              Language: {parent?.language || "Tamil"} · {parent?.dialect || "Standard"}
            </Text>
          </View>

          <View style={styles.voiceBadge}>
            <Ionicons name="mic" size={14} color={NilaColors.emerald} />
            <Text style={styles.voiceBadgeText}>READY</Text>
          </View>
        </View>

        {/* Preferences Section */}
        <Text style={styles.sectionHeader}>PREFERENCES & CONFIG</Text>

        <View style={styles.menuContainer}>
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, idx < menuItems.length - 1 && styles.menuItemDivider]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name={item.icon as any} size={20} color={NilaColors.gold} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={18} color={NilaColors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out Action */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => setShowSignOutModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={18} color={NilaColors.coral} />
          <Text style={styles.signOutButtonText}>Sign Out of Nila</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Sign Out Confirmation Modal */}
      <Modal
        visible={showSignOutModal}
        transparent
        animationType="fade"
        onRequestClose={() => !isSigningOut && setShowSignOutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="log-out-outline" size={28} color={NilaColors.coral} />
            </View>

            <Text style={styles.modalTitle}>Sign Out of Nila?</Text>
            <Text style={styles.modalSubtitle}>
              Are you sure you want to sign out? You can sign back in anytime with your mobile number.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowSignOutModal(false)}
                disabled={isSigningOut}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDestructiveButton}
                onPress={confirmSignOut}
                disabled={isSigningOut}
                activeOpacity={0.7}
              >
                {isSigningOut ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalDestructiveText}>Sign Out</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: NilaColors.textPrimary,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: NilaColors.textSecondary,
    lineHeight: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: NilaColors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    marginBottom: 24,
  },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: NilaColors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    borderWidth: 1.5,
    borderColor: NilaColors.goldMuted,
  },
  avatarEmoji: {
    fontSize: 26,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: NilaColors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 3,
  },
  userRole: {
    color: NilaColors.textSecondary,
    fontSize: 13,
  },
  voiceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: NilaColors.emeraldMuted,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: NilaColors.emerald,
  },
  voiceBadgeText: {
    color: NilaColors.emerald,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  sectionHeader: {
    color: NilaColors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  menuContainer: {
    backgroundColor: NilaColors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  menuItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: NilaColors.cardBorderSubtle,
  },
  menuIconContainer: {
    width: 32,
    alignItems: "center",
    marginRight: 12,
  },
  menuTitle: {
    flex: 1,
    color: NilaColors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 107, 107, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.2)",
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 24,
    gap: 8,
  },
  signOutButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: NilaColors.coral,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(10, 14, 26, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: NilaColors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    padding: 24,
    alignItems: "center",
  },
  modalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 107, 107, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: NilaColors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: NilaColors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: NilaColors.textSecondary,
  },
  modalDestructiveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: NilaColors.coral,
    alignItems: "center",
    justifyContent: "center",
  },
  modalDestructiveText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});
