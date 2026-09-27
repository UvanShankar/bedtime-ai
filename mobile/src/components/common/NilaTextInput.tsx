import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from "react-native";
import { NilaColors } from "../../theme/colors";

interface NilaTextInputProps extends TextInputProps {
  label?: string;
  sublabel?: string;
  error?: string;
  containerStyle?: ViewStyle;
  rightElement?: React.ReactNode;
}

export const NilaTextInput: React.FC<NilaTextInputProps> = ({
  label,
  sublabel,
  error,
  containerStyle,
  rightElement,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          error ? styles.inputWrapperError : null,
          props.multiline ? styles.inputWrapperMultiline : null,
        ]}
      >
        <TextInput
          placeholderTextColor={NilaColors.textMuted}
          style={[styles.input, props.multiline && styles.inputMultiline, style]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={NilaColors.gold}
          {...props}
        />
        {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: NilaColors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  sublabel: {
    color: NilaColors.textMuted,
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 16,
  },
  inputWrapper: {
    backgroundColor: NilaColors.surface,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: NilaColors.cardBorder,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    minHeight: 52,
  },
  inputWrapperMultiline: {
    minHeight: 110,
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  inputWrapperFocused: {
    borderColor: NilaColors.gold,
    backgroundColor: NilaColors.surfaceLight,
  },
  inputWrapperError: {
    borderColor: NilaColors.coral,
  },
  input: {
    flex: 1,
    color: NilaColors.textPrimary,
    fontSize: 15,
  },
  inputMultiline: {
    height: "100%",
    textAlignVertical: "top",
  },
  rightElement: {
    marginLeft: 8,
  },
  errorText: {
    color: NilaColors.coral,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
