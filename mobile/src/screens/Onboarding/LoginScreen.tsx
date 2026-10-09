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
import { logger } from "../../utils/logger";

interface Props {
  navigation: any;
}

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { setParent } = useNila();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
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
    logger.info("AUTH", `[LoginScreen] User requested OTP for ${fullPhone}`);

    try {
      const res = await AuthApi.sendOtp(fullPhone);
      setStep("otp");
      setResendTimer(30);
      if (res?.otp) {
        logger.info("AUTH", `[LoginScreen] OTP received: ${res.otp}`);
        setInfoMessage(`Verification code sent! (Code: ${res.otp})`);
        setOtp(res.otp);
      } else {
        setInfoMessage(`Verification code sent to ${fullPhone}`);
      }
    } catch (err: any) {
      logger.warn("AUTH", `[LoginScreen] Send OTP fallback triggered: ${err.message}`);
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
    logger.info("AUTH", `[LoginScreen] User submitting OTP ${otp.trim()} for ${fullPhone}`);

    try {
      const res = await AuthApi.verifyOtp({
        phoneNumber: fullPhone,
        otp: otp.trim(),
      });

      if (res?.user) {
        logger.success("AUTH", `[LoginScreen] Logged in successfully: ${res.user.fullName} (${res.user.userId})`);
        setParent((prev) => ({
          ...prev,
          id: res.user.userId,
          name: res.user.fullName || "Parent",
          phone: res.user.mobile,
        }));
      }
      navigation.navigate("MainTabs");
    } catch (err: any) {
      logger.error("AUTH", `[LoginScreen] OTP verification failed: ${err.message}`);
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
            {step === "phone" ? "Welcome back" : "Verify code"}
          </Text>
          <Text style={styles.subtitle}>
            {step === "phone"
              ? "Sign in with your mobile number to access your bedtime stories and cloned voices."
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
              <Text style={styles.fieldLabel}>Phone Number</Text>
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

              <NilaButton
                title={loading ? "Sending Code..." : "Send Verification Code"}
                onPress={handleSendOtp}
                disabled={loading}
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
                title={loading ? "Verifying..." : "Verify & Sign In"}
                onPress={handleVerifyOtp}
                disabled={loading}
                style={styles.submitButton}
              />
            </View>
          )}

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or quick demo</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialButton}
              activeOpacity={0.8}
              onPress={() => {
                setPhoneNumber("9876543210");
                setStep("otp");
                setOtp("123456");
                setInfoMessage("Demo code 123456 applied");
              }}
            >
              <Ionicons name="flash" size={18} color={NilaColors.gold} />
              <Text style={styles.socialButtonText}>Auto-Fill Demo (+91 9876543210)</Text>
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
    marginBottom: 24,
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
