import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NilaColors } from "../../theme/colors";
import { NilaButton } from "../../components/common/NilaButton";
import { useNila } from "../../context/NilaContext";

interface Props {
  route: any;
  navigation: any;
}

export const StoryCompleteScreen: React.FC<Props> = ({ route, navigation }) => {
  const { selectedChild } = useNila();
  const { story } = route.params || {};

  const handleListenAgain = () => {
    navigation.replace("StoryPlayer", { story });
  };

  const handleDone = () => {
    navigation.navigate("MainTabs", { screen: "Home" });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.moonWrapper}>
          <Text style={styles.moonIcon}>☾</Text>
        </View>

        <Text style={styles.title}>Good night, {selectedChild?.name || "Aarav"}.</Text>
        <Text style={styles.tamilFarewell}>"நல்லா தூங்கு கண்ணா..."</Text>

        <Text style={styles.starIcon}>✦</Text>
        <Text style={styles.sweetDreams}>Sweet dreams</Text>

        <View style={styles.rewardBadge}>
          <Text style={styles.rewardText}>🌙 New night sticker unlocked</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <NilaButton
          title="Listen again"
          variant="secondary"
          onPress={handleListenAgain}
          style={styles.listenAgainButton}
        />
        <NilaButton title="Done" onPress={handleDone} />
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
  moonWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(245, 199, 106, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  moonIcon: {
    fontSize: 54,
    color: NilaColors.gold,
    textShadowColor: NilaColors.goldGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: NilaColors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  tamilFarewell: {
    fontSize: 18,
    color: NilaColors.gold,
    fontStyle: "italic",
    marginBottom: 20,
    textAlign: "center",
  },
  starIcon: {
    fontSize: 20,
    color: NilaColors.gold,
    marginBottom: 6,
  },
  sweetDreams: {
    fontSize: 16,
    color: NilaColors.textSecondary,
    marginBottom: 28,
  },
  rewardBadge: {
    backgroundColor: NilaColors.surface,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
  },
  rewardText: {
    color: NilaColors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  footer: {
    paddingBottom: 36,
  },
  listenAgainButton: {
    marginBottom: 12,
  },
});
