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
import { useNila } from "../../context/NilaContext";

interface Props {
  navigation: any;
}

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { parent, selectedChild, voiceProfile } = useNila();

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
      onPress: () => Alert.alert("Family Sharing", "Invite spouse or grandparents to narrate bedtime stories."),
    },
    {
      id: "privacy",
      title: "Privacy & Data Vault",
      icon: "shield-checkmark-outline",
      onPress: () => navigation.navigate("Settings"),
    },
    {
      id: "notifications",
      title: "Bedtime Notifications",
      icon: "notifications-outline",
      onPress: () => Alert.alert("Bedtime Reminder", "Bedtime gentle chime is set for 8:30 PM daily."),
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
            <Text style={styles.userName}>{parent?.name || "Uvan"}</Text>
            <Text style={styles.userRole}>
              Primary Guardian • {parent?.language || "Tamil"}
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
      </ScrollView>
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
});
