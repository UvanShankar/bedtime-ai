import React from "react";
import { View, Text, Switch, StyleSheet, ViewStyle } from "react-native";
import { NilaColors } from "../../theme/colors";

interface NilaToggleProps {
  label: string;
  sublabel?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  style?: ViewStyle;
}

export const NilaToggle: React.FC<NilaToggleProps> = ({
  label,
  sublabel,
  value,
  onValueChange,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: NilaColors.cardBorder, true: NilaColors.gold }}
        thumbColor={value ? NilaColors.midnight : NilaColors.textSecondary}
        ios_backgroundColor={NilaColors.cardBorder}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
  },
  label: {
    color: NilaColors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  sublabel: {
    color: NilaColors.textMuted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
});
