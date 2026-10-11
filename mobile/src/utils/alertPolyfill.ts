import { Platform, Alert } from "react-native";
import { showGlobalToast, ToastType } from "../context/ToastContext";

// Polyfill Alert.alert for React Native Web with celestial themed toast integration
if (Platform.OS === "web") {
  Alert.alert = (
    title: string,
    message?: string,
    buttons?: Array<{
      text?: string;
      onPress?: () => void;
      style?: "default" | "cancel" | "destructive";
    }>,
    _options?: any
  ) => {
    const fullText = [title, message].filter(Boolean).join("\n\n");

    // Single button or no buttons -> Display non-blocking in-theme Toast
    if (!buttons || buttons.length <= 1) {
      const lower = ((title || "") + " " + (message || "")).toLowerCase();
      let type: ToastType = "info";

      if (/error|fail|failed|invalid|unable|could not|cannot|exception/i.test(lower)) {
        type = "error";
      } else if (/saved|success|updated|ready|created|deleted|added/i.test(lower)) {
        type = "success";
      } else if (/warn|warning|required|missing|consent/i.test(lower)) {
        type = "warning";
      }

      showGlobalToast({
        title,
        message,
        type,
      });

      if (buttons && buttons.length === 1) {
        buttons[0]?.onPress?.();
      }
      return;
    }

    // 2 or more buttons -> interactive confirm modal
    const confirmButton =
      buttons.find((b) => b.style === "destructive" || (b.text !== "Cancel" && b.style !== "cancel")) ||
      buttons[buttons.length - 1];
    const cancelButton = buttons.find((b) => b.style === "cancel" || b.text === "Cancel");

    let confirmed = false;
    if (typeof window !== "undefined") {
      confirmed = window.confirm(fullText);
    }

    if (confirmed) {
      confirmButton?.onPress?.();
    } else {
      cancelButton?.onPress?.();
    }
  };
}
