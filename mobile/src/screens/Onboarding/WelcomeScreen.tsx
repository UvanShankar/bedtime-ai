import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NilaColors } from "../../theme/colors";
import { NilaButton } from "../../components/common/NilaButton";

interface Props {
  navigation: any;
}

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Glow illustration */}
        <View style={styles.illustrationWrapper}>
          <View style={styles.glowCircle} />
          <Text style={styles.moonIcon}>☾</Text>
          <Text style={styles.starIcon1}>✦</Text>
          <Text style={styles.starIcon2}>✦</Text>
        </View>

        <Text style={styles.brandTitle}>NILA</Text>
        <Text style={styles.tagline}>Your voice. Their bedtime.</Text>

        <Text style={styles.description}>
          Personalized bedtime stories in the voice and language your child knows best.
        </Text>
      </View>

      <View style={styles.footer}>
        <NilaButton
          title="Get Started"
          onPress={() => navigation.navigate("Signup")}
          style={styles.ctaButton}
        />
        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          activeOpacity={0.7}
          style={styles.loginLink}
        >
          <Text style={styles.loginText}>
            I already have an account. <Text style={styles.loginHighlight}>Sign in</Text>
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
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
  },
  illustrationWrapper: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    position: "relative",
  },
  glowCircle: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(245, 199, 106, 0.08)",
  },
  moonIcon: {
    fontSize: 72,
    color: NilaColors.gold,
    textShadowColor: NilaColors.goldGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  starIcon1: {
    position: "absolute",
    top: 20,
    right: 28,
    fontSize: 16,
    color: NilaColors.gold,
  },
  starIcon2: {
    position: "absolute",
    bottom: 24,
    left: 24,
    fontSize: 12,
    color: NilaColors.dreamBlue,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: NilaColors.textPrimary,
    letterSpacing: 4,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    fontWeight: "700",
    color: NilaColors.textPrimary,
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: NilaColors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  footer: {
    paddingBottom: 32,
  },
  ctaButton: {
    marginBottom: 16,
  },
  loginLink: {
    alignItems: "center",
    paddingVertical: 8,
  },
  loginText: {
    color: NilaColors.textMuted,
    fontSize: 14,
  },
  loginHighlight: {
    color: NilaColors.gold,
    fontWeight: "600",
  },
});
