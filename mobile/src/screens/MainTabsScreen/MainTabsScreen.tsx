import React, { useState } from "react";
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
  const initialTab: TabName = route?.params?.initialTab || "Home";
  const [activeTab, setActiveTab] = useState<TabName>(initialTab);

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
