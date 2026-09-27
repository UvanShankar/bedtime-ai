import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NilaColors } from "../../theme/colors";

export type TabName = "Home" | "Stories" | "Memories" | "Profile";

interface NilaTabBarProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}

export const NilaTabBar: React.FC<NilaTabBarProps> = ({ activeTab, onTabChange }) => {
  const tabs: { name: TabName; label: string; iconFocused: any; iconOutline: any }[] = [
    { name: "Home", label: "Home", iconFocused: "home", iconOutline: "home-outline" },
    { name: "Stories", label: "Stories", iconFocused: "book", iconOutline: "book-outline" },
    { name: "Memories", label: "Memories", iconFocused: "sparkles", iconOutline: "sparkles-outline" },
    { name: "Profile", label: "Profile", iconFocused: "person", iconOutline: "person-outline" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {tabs.map((tab) => {
          const isFocused = activeTab === tab.name;
          const color = isFocused ? NilaColors.gold : NilaColors.textMuted;

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => onTabChange(tab.name)}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isFocused ? tab.iconFocused : tab.iconOutline}
                size={22}
                color={color}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color },
                  isFocused && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
              {isFocused && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: NilaColors.midnight,
    borderTopWidth: 1,
    borderTopColor: NilaColors.cardBorderSubtle,
  },
  bar: {
    flexDirection: "row",
    height: 64,
    paddingBottom: 6,
    paddingTop: 8,
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: "500",
  },
  tabLabelActive: {
    fontWeight: "700",
  },
  activeIndicator: {
    position: "absolute",
    bottom: -6,
    width: 16,
    height: 2.5,
    backgroundColor: NilaColors.gold,
    borderRadius: 2,
  },
});
