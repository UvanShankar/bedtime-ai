import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NilaColors } from "../theme/colors";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastOptions {
  title: string;
  message?: string;
  type?: ToastType;
  durationMs?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
  hideToast: () => {},
});

// Global singleton listener so non-hook code (e.g. alertPolyfill, API clients) can trigger toasts
let globalToastHandler: ((options: ToastOptions) => void) | null = null;

export const showGlobalToast = (options: ToastOptions) => {
  if (globalToastHandler) {
    globalToastHandler(options);
  }
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastOptions | null>(null);

  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  }, [translateY, opacity]);

  const showToast = useCallback(
    (options: ToastOptions) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setToast(options);
      translateY.setValue(-80);
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const duration = options.durationMs || 3400;
      timerRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [translateY, opacity, hideToast]
  );

  useEffect(() => {
    globalToastHandler = showToast;
    return () => {
      globalToastHandler = null;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [showToast]);

  const typeConfig = {
    success: {
      borderColor: NilaColors.emerald,
      glowColor: NilaColors.emeraldMuted,
      icon: "sparkles" as const,
      iconColor: NilaColors.emerald,
      iconBg: "rgba(52, 211, 153, 0.15)",
    },
    error: {
      borderColor: NilaColors.coral,
      glowColor: NilaColors.coralMuted,
      icon: "alert-circle" as const,
      iconColor: NilaColors.coral,
      iconBg: "rgba(248, 113, 113, 0.15)",
    },
    warning: {
      borderColor: NilaColors.gold,
      glowColor: NilaColors.goldMuted,
      icon: "warning-outline" as const,
      iconColor: NilaColors.gold,
      iconBg: "rgba(245, 199, 106, 0.15)",
    },
    info: {
      borderColor: NilaColors.gold,
      glowColor: NilaColors.goldMuted,
      icon: "moon" as const,
      iconColor: NilaColors.gold,
      iconBg: "rgba(245, 199, 106, 0.15)",
    },
  };

  const currentType = toast?.type || "info";
  const config = typeConfig[currentType];
  const topOffset = Math.max(insets.top, Platform.OS === "web" ? 16 : 12) + 6;

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.container,
            {
              top: topOffset,
              opacity,
              transform: [{ translateY }],
            },
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            style={[
              styles.toastCard,
              {
                borderColor: config.borderColor,
                shadowColor: config.borderColor,
              },
            ]}
            onPress={hideToast}
            activeOpacity={0.9}
          >
            {/* Left Icon with Celestial Glow */}
            <View style={[styles.iconCircle, { backgroundColor: config.iconBg }]}>
              <Ionicons name={config.icon} size={20} color={config.iconColor} />
            </View>

            {/* Content Text */}
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {toast.title}
              </Text>
              {toast.message ? (
                <Text style={styles.message} numberOfLines={2}>
                  {toast.message}
                </Text>
              ) : null}
            </View>

            {/* Close Button */}
            <TouchableOpacity
              onPress={hideToast}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={18} color={NilaColors.textMuted} />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 99999,
    alignItems: "center",
  },
  toastCard: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 440,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderRadius: 18,
    borderWidth: 1.2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    ...(Platform.OS === "web"
      ? {
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          cursor: "pointer",
        }
      : {}),
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: NilaColors.textPrimary,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    color: NilaColors.textSecondary,
    lineHeight: 16,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 4,
  },
});
