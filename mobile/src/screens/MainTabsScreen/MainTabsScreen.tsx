import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { NilaColors } from "../../theme/colors";
import { NilaTabBar, TabName } from "../../components/common/NilaTabBar";
import { HomeScreen } from "../HomeScreen/HomeScreen";
import { StoriesScreen } from "../StoriesScreen/StoriesScreen";
import { MemoriesScreen } from "../MemoriesScreen/MemoriesScreen";
import { ProfileScreen } from "../ProfileScreen/ProfileScreen";

interface Props {
  route?: any;
  navigation: any;
}

export const MainTabsScreen: React.FC<Props> = ({ route, navigation }) => {
  const getRequestedTab = (): TabName => {
    const raw = route?.params?.screen || route?.params?.initialTab || route?.params?.tab;
    if (!raw) return "Home";
    const normalized = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    if (["Home", "Stories", "Memories", "Profile"].includes(normalized)) {
      return normalized as TabName;
    }
    return "Home";
  };

  const [activeTab, setActiveTab] = useState<TabName>(getRequestedTab());

  useEffect(() => {
    const requested = getRequestedTab();
    if (requested) {
      setActiveTab(requested);
    }
  }, [route?.params?.screen, route?.params?.initialTab, route?.params?.tab]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {activeTab === "Home" && <HomeScreen navigation={navigation} />}
        {activeTab === "Stories" && <StoriesScreen navigation={navigation} />}
        {activeTab === "Memories" && <MemoriesScreen navigation={navigation} />}
        {activeTab === "Profile" && <ProfileScreen navigation={navigation} />}
      </View>
      <NilaTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NilaColors.midnight,
  },
  content: {
    flex: 1,
  },
});
