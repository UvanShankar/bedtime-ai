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
import { OnboardingHeader } from "../../components/common/OnboardingHeader";
import { useNila } from "../../context/NilaContext";
import { AuthApi } from "../../services/api/AuthApi";

interface Props {
  navigation: any;
}

export const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const { setParent } = useNila();
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
      console.warn("[SignupScreen] Send OTP fallback:", err.message);
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
        fullName: "",
        relationship: "Parent",
      });

      if (res?.user) {
        setParent((prev) => ({
          ...prev,
          id: res.user.userId,
          name: res.user.fullName || "",
          phone: res.user.mobile,
          relationship: res.user.relationship || "Mother",
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
      <OnboardingHeader
        step={1}
        totalSteps={4}
        title={step === "phone" ? "Enter Mobile Number" : "Verify Your Code"}
        subtitle={
          step === "phone"
            ? "We'll send a 6-digit verification code to keep your family stories secure."
            : `Enter the 6-digit code sent to ${formatPhoneNumber(phoneNumber)}`
        }
        onBack={() => {
          if (step === "otp") {
            setStep("phone");
            setErrorMessage("");
            setInfoMessage("");
          } else {
            navigation.goBack();
          }
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
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
                  {termsAccepted && (
                    <Ionicons name="checkmark" size={14} color={NilaColors.midnight} />
                  )}
                </View>
                <Text style={styles.termsText}>
                  I agree to Nila's <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                  <Text style={styles.termsLink}>Privacy Policy</Text>.
                </Text>
              </TouchableOpacity>

              <NilaButton
                title={loading ? "Sending Code..." : "Continue"}
                onPress={handleSendOtp}
                disabled={loading || !termsAccepted}
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
              />

              <View style={styles.resendRow}>
                {resendTimer > 0 ? (
                  <Text style={styles.resendTimerText}>
                    Resend code in {resendTimer}s
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleSendOtp} activeOpacity={0.7}>
                    <Text style={styles.resendLinkText}>Resend Code</Text>
                  </TouchableOpacity>
                )}
              </View>

              <NilaButton
                title={loading ? "Verifying..." : "Verify & Continue"}
                onPress={handleVerifyOtp}
                disabled={loading || !otp.trim()}
                style={styles.submitButton}
              />
            </View>
          )}

          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.7}
            style={styles.switchAuthLink}
          >
            <Text style={styles.switchAuthText}>
              Already registered? <Text style={styles.switchAuthHighlight}>Sign In</Text>
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
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: NilaColors.textPrimary,
    marginBottom: 8,
  },
  phoneInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  countryCodeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 52,
    gap: 6,
  },
  flagText: {
    fontSize: 18,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: "700",
    color: NilaColors.textPrimary,
  },
  phoneInputWrapper: {
    flex: 1,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 28,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: NilaColors.gold,
    borderColor: NilaColors.gold,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: NilaColors.textMuted,
    lineHeight: 18,
  },
  termsLink: {
    color: NilaColors.gold,
    fontWeight: "600",
  },
  submitButton: {
    marginBottom: 16,
  },
  resendRow: {
    alignItems: "center",
    marginBottom: 24,
  },
  resendTimerText: {
    fontSize: 13,
    color: NilaColors.textMuted,
  },
  resendLinkText: {
    fontSize: 13,
    color: NilaColors.gold,
    fontWeight: "600",
  },
  switchAuthLink: {
    alignItems: "center",
    paddingVertical: 12,
  },
  switchAuthText: {
    fontSize: 13,
    color: NilaColors.textMuted,
  },
  switchAuthHighlight: {
    color: NilaColors.gold,
    fontWeight: "700",
  },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 199, 106, 0.12)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(245, 199, 106, 0.25)",
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: NilaColors.gold,
    fontWeight: "500",
  },
  errorBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 107, 0.12)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.25)",
  },
  errorBadgeText: {
    flex: 1,
    fontSize: 12,
    color: "#FF6B6B",
    fontWeight: "500",
  },
});
