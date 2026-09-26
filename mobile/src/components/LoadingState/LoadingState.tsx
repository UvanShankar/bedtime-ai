import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

interface LoadingStateProps {
  message?: string;
  submessage?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Generating your bedtime story...",
  submessage = "Infusing your parent storytelling style & synthesizing calm narration...",
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#38BDF8" />
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.submessage}>{submessage}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  submessage: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 18,
  },
});
