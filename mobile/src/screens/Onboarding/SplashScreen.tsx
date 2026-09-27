import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { NilaColors } from "../../theme/colors";

interface Props {
  navigation: any;
}

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("Welcome");
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.starIcon}>✦</Text>
      <Text style={styles.moonIcon}>☾</Text>
      <Text style={styles.brandTitle}>NILA</Text>
      <Text style={styles.tagline}>Your voice. Their bedtime.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NilaColors.midnight,
    alignItems: "center",
    justifyContent: "center",
  },
  starIcon: {
    fontSize: 22,
    color: NilaColors.gold,
    marginBottom: 12,
    opacity: 0.85,
  },
  moonIcon: {
    fontSize: 64,
    color: NilaColors.gold,
    marginBottom: 20,
    textShadowColor: NilaColors.goldGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  brandTitle: {
    fontSize: 38,
    fontWeight: "900",
    color: NilaColors.textPrimary,
    letterSpacing: 6,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 15,
    color: NilaColors.textSecondary,
    letterSpacing: 0.5,
  },
});
