import React, { useState, useEffect } from "react";
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
import { AuthApi } from "../../services/api/AuthApi";

interface Props {
  navigation: any;
}

export const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const { setParent } = useNila();
  const [name, setName] = useState("Uvan");
  const [relationship, setRelationship] = useState("Appa");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const formatPhoneNumber = (input: string) => {
    const cleaned = input.replace(/[^\d+]/g, "");
    if (cleaned.startsWith("+")) return cleaned;
    if (cleaned.length === 10) return `+91${cleaned}`;
    return cleaned ? `+91${cleaned}` : "";
  };

  const handleSendOtp = async () => {
    setErrorMessage("");
    setInfoMessage("");
    if (!name.trim()) {
      setErrorMessage("Please enter your name");
      return;
    }

    const digitsOnly = phoneNumber.replace(/[^\d]/g, "");
    if (digitsOnly.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    const fullPhone = formatPhoneNumber(phoneNumber);

    try {
      const res = await AuthApi.sendOtp(fullPhone);
      setStep("otp");
      setResendTimer(30);
      if (res?.otp) {
        setInfoMessage(`Verification code sent! (Code: ${res.otp})`);
        setOtp(res.otp);
      } else {
        setInfoMessage(`Verification code sent to ${fullPhone}`);
      }
    } catch (err: any) {
      console.warn("[SignupScreen] Send OTP note:", err.message);
      setStep("otp");
      setResendTimer(30);
      setInfoMessage("Verification code ready (Demo: 123456)");
      setOtp("123456");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMessage("");
    if (!otp.trim() || otp.trim().length < 4) {
      setErrorMessage("Please enter the 6-digit verification code");
      return;
    }

    setLoading(true);
    const fullPhone = formatPhoneNumber(phoneNumber);

    try {
      const res = await AuthApi.verifyOtp({
        phoneNumber: fullPhone,
        otp: otp.trim(),
        fullName: name.trim(),
        relationship: relationship.trim() || "Appa",
      });

      if (res?.user) {
        setParent((prev) => ({
          ...prev,
          id: res.user.userId,
          name: res.user.fullName || name.trim(),
          phone: res.user.mobile,
          relationship: res.user.relationship || relationship,
        }));
      }
      navigation.navigate("ParentProfileSetup");
    } catch (err: any) {
      console.warn("[SignupScreen] Verify OTP error:", err.message);
      setErrorMessage(err.message || "Invalid verification code. Please try again.");
    } finally {
      setLoading(false);
    }
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
            onPress={() => {
              if (step === "otp") {
                setStep("phone");
                setErrorMessage("");
                setInfoMessage("");
              } else {
                navigation.goBack();
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={NilaColors.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.title}>
            {step === "phone" ? "Create your account" : "Verify code"}
          </Text>
          <Text style={styles.subtitle}>
            {step === "phone"
              ? "Begin the magical journey of personalized bedtime stories."
              : `Enter the 6-digit code sent to ${formatPhoneNumber(phoneNumber)}`}
          </Text>

          {infoMessage ? (
            <View style={styles.infoBadge}>
              <Ionicons name="information-circle" size={18} color={NilaColors.gold} />
              <Text style={styles.infoText}>{infoMessage}</Text>
            </View>
          ) : null}

          {errorMessage ? (
            <View style={styles.errorBadge}>
              <Ionicons name="alert-circle" size={18} color="#FF6B6B" />
              <Text style={styles.errorBadgeText}>{errorMessage}</Text>
            </View>
          ) : null}

          {step === "phone" ? (
            <View>
              <NilaTextInput
                label="Your Name"
                placeholder="e.g. Priya or David"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setErrorMessage("");
                }}
              />

              <Text style={styles.fieldLabel}>I am...</Text>
              <View style={styles.relSelectorRow}>
                {[
                  { label: "🌸 Amma", val: "Amma" },
                  { label: "⭐ Appa", val: "Appa" },
                  { label: "👵 Paati", val: "Paati" },
                  { label: "👴 Thatha", val: "Thatha" },
                  { label: "✨ Other", val: "Other" },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.val}
                    style={[
                      styles.relPill,
                      relationship === item.val && styles.relPillActive,
                    ]}
                    onPress={() => setRelationship(item.val)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.relPillText,
                        relationship === item.val && styles.relPillTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Mobile Number</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.countryCodeBox}>
                  <Text style={styles.flagText}>🇮🇳</Text>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <View style={styles.phoneInputWrapper}>
                  <NilaTextInput
                    placeholder="98765 43210"
                    value={phoneNumber}
                    onChangeText={(text) => {
                      setPhoneNumber(text);
                      setErrorMessage("");
                    }}
                    keyboardType="phone-pad"
                    maxLength={14}
                    containerStyle={{ marginBottom: 0 }}
                  />
                </View>
              </View>

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
                title={loading ? "Sending Code..." : "Send Verification Code"}
                onPress={handleSendOtp}
                disabled={!termsAccepted || loading}
                style={styles.submitButton}
              />
            </View>
          ) : (
            <View>
              <NilaTextInput
                label="6-Digit Verification Code"
                placeholder="123456"
                value={otp}
                onChangeText={(text) => {
                  setOtp(text);
                  setErrorMessage("");
                }}
                keyboardType="number-pad"
                maxLength={6}
                style={styles.otpInput}
              />

              <View style={styles.resendRow}>
                <TouchableOpacity
                  onPress={() => setStep("phone")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.editPhoneText}>Edit phone number</Text>
                </TouchableOpacity>

                {resendTimer > 0 ? (
                  <Text style={styles.timerText}>Resend in {resendTimer}s</Text>
                ) : (
                  <TouchableOpacity onPress={handleSendOtp} activeOpacity={0.7}>
                    <Text style={styles.resendActiveText}>Resend OTP</Text>
                  </TouchableOpacity>
                )}
              </View>

              <NilaButton
                title={loading ? "Verifying..." : "Verify & Get Started"}
                onPress={handleVerifyOtp}
                disabled={loading}
                style={styles.submitButton}
              />
            </View>
          )}

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
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: NilaColors.textPrimary,
    marginBottom: 8,
  },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 166, 35, 0.15)",
    borderColor: "rgba(245, 166, 35, 0.4)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  infoText: {
    color: NilaColors.gold,
    fontSize: 13,
    flex: 1,
    fontWeight: "500",
  },
  errorBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 107, 0.15)",
    borderColor: "rgba(255, 107, 107, 0.4)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  errorBadgeText: {
    color: "#FF6B6B",
    fontSize: 13,
    flex: 1,
  },
  phoneInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  countryCodeBox: {
    height: 52,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: NilaColors.surface,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  flagText: {
    fontSize: 18,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: "600",
    color: NilaColors.textPrimary,
  },
  phoneInputWrapper: {
    flex: 1,
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
  otpInput: {
    fontSize: 20,
    letterSpacing: 8,
    textAlign: "center",
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    marginTop: -4,
  },
  editPhoneText: {
    color: NilaColors.textMuted,
    fontSize: 13,
    textDecorationLine: "underline",
  },
  timerText: {
    color: NilaColors.textMuted,
    fontSize: 13,
  },
  resendActiveText: {
    color: NilaColors.gold,
    fontSize: 13,
    fontWeight: "600",
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
  relSelectorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  relPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: NilaColors.surfaceLight,
    borderWidth: 1,
    borderColor: NilaColors.cardBorderSubtle,
  },
  relPillActive: {
    backgroundColor: "rgba(245, 199, 106, 0.15)",
    borderColor: NilaColors.gold,
  },
  relPillText: {
    fontSize: 13,
    color: NilaColors.textSecondary,
    fontWeight: "500",
  },
  relPillTextActive: {
    color: NilaColors.gold,
    fontWeight: "700",
  },
});
