import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NilaColors } from "../../theme/colors";
import { NilaTextInput } from "../../components/common/NilaTextInput";
import { NilaButton } from "../../components/common/NilaButton";

interface Props {
  navigation: any;
}

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState("parent@example.com");
  const [password, setPassword] = useState("••••••••");

  const handleLogin = () => {
    navigation.navigate("MainTabs");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={NilaColors.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to access your saved voices and stories.</Text>

          <NilaTextInput
            label="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <NilaTextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.forgotPassword} activeOpacity={0.7}>
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>

          <NilaButton title="Continue" onPress={handleLogin} style={styles.submitButton} />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8} onPress={handleLogin}>
              <Ionicons name="logo-google" size={18} color={NilaColors.textPrimary} />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8} onPress={handleLogin}>
              <Ionicons name="logo-apple" size={20} color={NilaColors.textPrimary} />
              <Text style={styles.socialButtonText}>Apple</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.switchAuth}
            onPress={() => navigation.navigate("Signup")}
            activeOpacity={0.7}
          >
            <Text style={styles.switchAuthText}>
              New to Nila? <Text style={styles.switchAuthHighlight}>Create account</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NilaColors.midnight,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },
  backButton: {
    marginBottom: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: NilaColors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: NilaColors.textSecondary,
    lineHeight: 20,
    marginBottom: 28,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: -4,
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: NilaColors.textMuted,
    fontSize: 13,
  },
  submitButton: {
    marginBottom: 24,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: NilaColors.cardBorder,
  },
  dividerText: {
    color: NilaColors.textMuted,
    fontSize: 13,
    paddingHorizontal: 12,
  },
  socialRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  socialButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: NilaColors.surface,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  socialButtonText: {
    color: NilaColors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  switchAuth: {
    alignItems: "center",
  },
  switchAuthText: {
    color: NilaColors.textSecondary,
    fontSize: 14,
  },
  switchAuthHighlight: {
    color: NilaColors.gold,
    fontWeight: "600",
  },
});
