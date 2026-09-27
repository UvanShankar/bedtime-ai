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
import { useNila } from "../../context/NilaContext";

interface Props {
  navigation: any;
}

export const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const { setParent } = useNila();
  const [name, setName] = useState("David");
  const [email, setEmail] = useState("parent@example.com");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(true);

  const handleSignup = () => {
    if (name.trim()) {
      setParent((prev) => ({ ...prev, name: name.trim() }));
    }
    navigation.navigate("ParentProfileSetup");
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

          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Begin the magical journey of personalized bedtime tales.
          </Text>

          <NilaTextInput
            label="Your Name"
            placeholder="e.g. Priya or David"
            value={name}
            onChangeText={setName}
          />

          <NilaTextInput
            label="Email address"
            placeholder="parent@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <NilaTextInput
            label="Password"
            placeholder="Create a strong password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setTermsAccepted(!termsAccepted)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, termsAccepted && styles.checkboxActive]}>
              {termsAccepted && <Ionicons name="checkmark" size={14} color={NilaColors.midnight} />}
            </View>
            <Text style={styles.checkboxText}>
              I agree to Nila's <Text style={styles.linkText}>Terms of Service</Text> and{" "}
              <Text style={styles.linkText}>Privacy Policy</Text>.
            </Text>
          </TouchableOpacity>

          <NilaButton
            title="Create account"
            onPress={handleSignup}
            disabled={!termsAccepted}
            style={styles.submitButton}
          />

          <TouchableOpacity
            style={styles.switchAuth}
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.7}
          >
            <Text style={styles.switchAuthText}>
              Already have an account? <Text style={styles.switchAuthHighlight}>Sign in</Text>
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
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: NilaColors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: NilaColors.gold,
    borderColor: NilaColors.gold,
  },
  checkboxText: {
    flex: 1,
    color: NilaColors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  linkText: {
    color: NilaColors.gold,
    textDecorationLine: "underline",
  },
  submitButton: {
    marginBottom: 24,
    marginTop: 8,
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
