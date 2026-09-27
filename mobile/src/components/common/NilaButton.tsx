import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { NilaColors } from "../../theme/colors";

interface NilaButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const NilaButton: React.FC<NilaButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  const getButtonStyle = () => {
    switch (variant) {
      case "primary":
        return styles.primaryButton;
      case "secondary":
        return styles.secondaryButton;
      case "outline":
        return styles.outlineButton;
      case "danger":
        return styles.dangerButton;
      case "ghost":
        return styles.ghostButton;
      default:
        return styles.primaryButton;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case "primary":
        return styles.primaryText;
      case "secondary":
        return styles.secondaryText;
      case "outline":
        return styles.outlineText;
      case "danger":
        return styles.dangerText;
      case "ghost":
        return styles.ghostText;
      default:
        return styles.primaryText;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.baseButton, getButtonStyle(), disabled && styles.disabledButton, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? NilaColors.textDark : NilaColors.gold} />
      ) : (
        <>
          {icon}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    height: 52,
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: NilaColors.gold,
    shadowColor: NilaColors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  secondaryButton: {
    backgroundColor: NilaColors.surfaceLight,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: NilaColors.gold,
  },
  dangerButton: {
    backgroundColor: NilaColors.coralMuted,
    borderWidth: 1,
    borderColor: NilaColors.coral,
  },
  ghostButton: {
    backgroundColor: "transparent",
  },
  disabledButton: {
    opacity: 0.45,
  },
  primaryText: {
    color: NilaColors.textDark,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  secondaryText: {
    color: NilaColors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  outlineText: {
    color: NilaColors.gold,
    fontSize: 15,
    fontWeight: "600",
  },
  dangerText: {
    color: NilaColors.coral,
    fontSize: 15,
    fontWeight: "600",
  },
  ghostText: {
    color: NilaColors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
});
