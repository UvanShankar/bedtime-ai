import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { NilaColors } from "../../theme/colors";

interface NilaPillProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  emoji?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: "gold" | "blue";
}

export const NilaPill: React.FC<NilaPillProps> = ({
  label,
  selected = false,
  onPress,
  emoji,
  style,
  textStyle,
  variant = "gold",
}) => {
  const isGold = variant === "gold";

  return (
    <TouchableOpacity
      style={[
        styles.pill,
        selected && (isGold ? styles.pillSelectedGold : styles.pillSelectedBlue),
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text
        style={[
          styles.pillText,
          selected && (isGold ? styles.pillTextSelectedGold : styles.pillTextSelectedBlue),
          textStyle,
        ]}
      >
        {emoji ? `${emoji}  ` : ""}
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: NilaColors.surface,
    borderWidth: 1.2,
    borderColor: NilaColors.cardBorder,
    marginRight: 8,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  pillSelectedGold: {
    backgroundColor: NilaColors.gold,
    borderColor: NilaColors.gold,
  },
  pillSelectedBlue: {
    backgroundColor: NilaColors.dreamBlue,
    borderColor: NilaColors.dreamBlue,
  },
  pillText: {
    color: NilaColors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
  pillTextSelectedGold: {
    color: NilaColors.textDark,
    fontWeight: "700",
  },
  pillTextSelectedBlue: {
    color: NilaColors.textDark,
    fontWeight: "700",
  },
});
