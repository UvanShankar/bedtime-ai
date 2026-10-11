import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NilaColors } from "../../theme/colors";

interface OnboardingHeaderProps {
  step: number;
  totalSteps?: number;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  onSkip?: () => void;
  skipLabel?: string;
}

export const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({
  step,
  totalSteps = 4,
  title,
  subtitle,
  onBack,
  onSkip,
  skipLabel = "Skip",
}) => {
  const progressPercent = Math.min(100, Math.max(10, (step / totalSteps) * 100));

  return (
    <View style={styles.container}>
      {/* Top Nav Row */}
      <View style={styles.topRow}>
        {onBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={22} color={NilaColors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}

        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>
            Step <Text style={styles.stepNumber}>{step}</Text> of {totalSteps}
          </Text>
        </View>

        {onSkip ? (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={onSkip}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.skipText}>{skipLabel}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}
      </View>

      {/* Progress Bar Track */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progressPercent}%` }]} />
      </View>

      {/* Header Titles */}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    minHeight: 36,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  spacer: {
    width: 36,
  },
  stepBadge: {
    backgroundColor: "rgba(245, 199, 106, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(245, 199, 106, 0.25)",
  },
  stepText: {
    fontSize: 12,
    fontWeight: "600",
    color: NilaColors.gold,
    letterSpacing: 0.5,
  },
  stepNumber: {
    fontWeight: "800",
    color: "#FFF",
  },
  skipButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  skipText: {
    fontSize: 13,
    fontWeight: "500",
    color: NilaColors.textMuted,
  },
  track: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 20,
  },
  fill: {
    height: "100%",
    backgroundColor: NilaColors.gold,
    borderRadius: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: NilaColors.textPrimary,
    lineHeight: 28,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: NilaColors.textMuted,
    lineHeight: 20,
  },
});
