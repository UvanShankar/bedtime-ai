import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { NilaColors } from "../../theme/colors";
import { ApiClient } from "../../services/api/ApiClient";
import { ParentApi } from "../../services/api/ParentApi";

interface Props {
  navigation: any;
}

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const token = await ApiClient.loadToken();
        if (token) {
          const profile = await ParentApi.getProfile();
          if (profile && profile.userId && isMounted) {
            navigation.replace("MainTabs");
            return;
          }
        }
      } catch (err) {
        console.log("[SplashScreen] Saved session expired or no token:", err);
      }

      if (isMounted) {
        navigation.replace("Welcome");
      }
    };

    const timer = setTimeout(() => {
      checkSession();
    }, 1500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
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
