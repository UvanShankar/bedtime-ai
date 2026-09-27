import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NilaColors } from "../../theme/colors";

interface NilaHeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export const NilaHeader: React.FC<NilaHeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.topRow}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={NilaColors.textPrimary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}

        {rightAction ? (
          <View style={styles.rightAction}>{rightAction}</View>
        ) : (
          <View style={styles.spacer} />
        )}
      </View>

      {title && <Text style={styles.title}>{title}</Text>}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    minHeight: 32,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -6,
  },
  backText: {
    color: NilaColors.textPrimary,
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 2,
  },
  spacer: {
    width: 32,
  },
  rightAction: {
    alignItems: "flex-end",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: NilaColors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: NilaColors.textSecondary,
    marginTop: 6,
    lineHeight: 20,
  },
});
