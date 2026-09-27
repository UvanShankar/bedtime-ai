import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NilaColors } from "../../theme/colors";
import { NilaButton } from "../../components/common/NilaButton";

interface Props {
  navigation: any;
}

export const VoiceReadyScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.illustrationWrapper}>
          <Text style={styles.starIcon}>✦</Text>
        </View>

        <Text style={styles.title}>Your voice is ready.</Text>
        <Text style={styles.subtitle}>
          Nila can now tell bedtime stories the way you would. Always warm, familiar, and close.
        </Text>
      </View>

      <View style={styles.footer}>
        <NilaButton
          title="Try a story"
          onPress={() => navigation.navigate("MainTabs", { screen: "Home" })}
          style={styles.ctaButton}
        />
        <NilaButton
          title="Preview my voice"
          variant="outline"
          onPress={() => navigation.navigate("MainTabs", { screen: "Profile" })}
        />
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(245, 199, 106, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  starIcon: {
    fontSize: 44,
    color: NilaColors.gold,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: NilaColors.textPrimary,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: NilaColors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  footer: {
    paddingBottom: 32,
  },
  ctaButton: {
    marginBottom: 14,
  },
});
