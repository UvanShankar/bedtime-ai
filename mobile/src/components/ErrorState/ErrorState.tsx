import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = "An unexpected error occurred",
  onRetry,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E293B",
    borderRadius: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  icon: {
    fontSize: 32,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    color: "#CBD5E1",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#38BDF8",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  buttonText: {
    color: "#0F172A",
    fontWeight: "600",
    fontSize: 14,
  },
});
