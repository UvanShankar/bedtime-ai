import React from "react";
import { View, StyleSheet, ViewStyle, TouchableOpacity } from "react-native";
import { NilaColors } from "../../theme/colors";

interface NilaCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  variant?: "surface" | "surfaceLight" | "goldOutline";
}

export const NilaCard: React.FC<NilaCardProps> = ({
  children,
  style,
  onPress,
  variant = "surface",
}) => {
  const getCardStyle = () => {
    switch (variant) {
      case "surfaceLight":
        return styles.surfaceLight;
      case "goldOutline":
        return styles.goldOutline;
      default:
        return styles.surface;
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, getCardStyle(), style]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.card, getCardStyle(), style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    marginBottom: 16,
  },
  surface: {
    backgroundColor: NilaColors.surface,
  },
  surfaceLight: {
    backgroundColor: NilaColors.surfaceLight,
  },
  goldOutline: {
    backgroundColor: NilaColors.surface,
    borderColor: NilaColors.gold,
  },
});
