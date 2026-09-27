import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { NilaColors } from "../../theme/colors";

interface NilaSliderProps {
  label?: string;
  leftLabel: string;
  rightLabel: string;
  value: number; // 0 to 1
  onValueChange: (val: number) => void;
  steps?: number; // e.g. 4 or 5
  style?: ViewStyle;
}

export const NilaSlider: React.FC<NilaSliderProps> = ({
  label,
  leftLabel,
  rightLabel,
  value,
  onValueChange,
  steps = 5,
  style,
}) => {
  // Generate step positions (e.g. [0, 0.25, 0.5, 0.75, 1])
  const stepValues = Array.from({ length: steps }, (_, i) => i / (steps - 1));

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Track & Dots */}
      <View style={styles.trackContainer}>
        <View style={styles.trackBackground} />
        <View style={[styles.trackActive, { width: `${value * 100}%` }]} />

        {/* Step checkpoints for easy tapping */}
        <View style={styles.stepsRow}>
          {stepValues.map((step, idx) => {
            const isSelected = Math.abs(value - step) < 0.08;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => onValueChange(step)}
                style={styles.stepTouchArea}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.stepDot,
                    step <= value && styles.stepDotPassed,
                    isSelected && styles.stepDotSelected,
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Labels below */}
      <View style={styles.labelsRow}>
        <Text style={[styles.endpointLabel, value < 0.5 && styles.activeEndpointLabel]}>
          {leftLabel}
        </Text>
        <Text style={[styles.endpointLabel, value >= 0.5 && styles.activeEndpointLabel]}>
          {rightLabel}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    color: NilaColors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  trackContainer: {
    height: 36,
    justifyContent: "center",
    position: "relative",
  },
  trackBackground: {
    position: "absolute",
    left: 8,
    right: 8,
    height: 4,
    backgroundColor: NilaColors.cardBorder,
    borderRadius: 2,
  },
  trackActive: {
    position: "absolute",
    left: 8,
    height: 4,
    backgroundColor: NilaColors.gold,
    borderRadius: 2,
  },
  stepsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepTouchArea: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: NilaColors.cardBorder,
  },
  stepDotPassed: {
    backgroundColor: NilaColors.gold,
  },
  stepDotSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: NilaColors.gold,
    borderWidth: 3,
    borderColor: NilaColors.midnight,
    shadowColor: NilaColors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  endpointLabel: {
    fontSize: 12,
    color: NilaColors.textMuted,
    fontWeight: "500",
  },
  activeEndpointLabel: {
    color: NilaColors.gold,
    fontWeight: "600",
  },
});
