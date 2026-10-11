import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NilaColors } from "../../theme/colors";
import { NilaButton } from "../../components/common/NilaButton";

interface Props {
  navigation: any;
}

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const highlights = [
    {
      icon: "mic-outline",
      title: "Your Loving Voice",
      desc: "Nila clones your soothing bedtime tone so you're always there.",
    },
    {
      icon: "sparkles-outline",
      title: "Their Favorite Adventures",
      desc: "Personalized tales starring your child, their age, and passions.",
    },
    {
      icon: "language-outline",
      title: "Family Language & Dialects",
      desc: "Narrated in the natural words, slang, and dialect you speak at home.",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Glow illustration */}
        <View style={styles.illustrationWrapper}>
          <View style={styles.glowCircle} />
          <Text style={styles.moonIcon}>☾</Text>
          <Text style={styles.starIcon1}>✦</Text>
          <Text style={styles.starIcon2}>✦</Text>
        </View>

        <Text style={styles.brandTitle}>NILA</Text>
        <Text style={styles.tagline}>Your voice. Their bedtime.</Text>

        <View style={styles.quickBadge}>
          <Ionicons name="time-outline" size={14} color={NilaColors.gold} />
          <Text style={styles.quickBadgeText}>2 minutes to your first bedtime story</Text>
        </View>

        {/* Feature Cards */}
        <View style={styles.highlightsContainer}>
          {highlights.map((item, idx) => (
            <View key={idx} style={styles.highlightCard}>
              <View style={styles.iconBox}>
                <Ionicons name={item.icon as any} size={20} color={NilaColors.gold} />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.highlightTitle}>{item.title}</Text>
                <Text style={styles.highlightDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <NilaButton
          title="Create Tonight's Story"
          onPress={() => navigation.navigate("Signup")}
          style={styles.ctaButton}
        />
        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          activeOpacity={0.7}
          style={styles.loginLink}
        >
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginHighlight}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NilaColors.midnight,
    justifyContent: "space-between",
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  illustrationWrapper: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    position: "relative",
  },
  glowCircle: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(245, 199, 106, 0.08)",
  },
  moonIcon: {
    fontSize: 68,
    color: NilaColors.gold,
    textShadowColor: NilaColors.goldGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  starIcon1: {
    position: "absolute",
    top: 14,
    right: 22,
    fontSize: 16,
    color: NilaColors.gold,
  },
  starIcon2: {
    position: "absolute",
    bottom: 18,
    left: 18,
    fontSize: 13,
    color: NilaColors.dreamBlue,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: NilaColors.textPrimary,
    letterSpacing: 4,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 15,
    color: NilaColors.gold,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  quickBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 199, 106, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(245, 199, 106, 0.2)",
    gap: 6,
    marginBottom: 20,
  },
  quickBadgeText: {
    fontSize: 12,
    color: NilaColors.gold,
    fontWeight: "600",
  },
  highlightsContainer: {
    width: "100%",
    gap: 12,
    marginBottom: 10,
  },
  highlightCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(245, 199, 106, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  cardTextContainer: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: NilaColors.textPrimary,
    marginBottom: 3,
  },
  highlightDesc: {
    fontSize: 12,
    color: NilaColors.textMuted,
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: NilaColors.midnight,
  },
  ctaButton: {
    marginBottom: 14,
  },
  loginLink: {
    alignItems: "center",
    paddingVertical: 8,
  },
  loginText: {
    fontSize: 14,
    color: NilaColors.textMuted,
  },
  loginHighlight: {
    color: NilaColors.gold,
    fontWeight: "700",
  },
});
